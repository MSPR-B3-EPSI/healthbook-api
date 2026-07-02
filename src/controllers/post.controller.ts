import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUserService } from '../auth/services/current-user.service.js';
import { CreatePostDto } from '../dto/post/create-post.dto.js';
import { GetPostsQueryDto } from '../dto/post/get-posts-query.dto.js';
import { UpdatePostDto } from '../dto/post/update-post.dto.js';
import {
  ApiPaginatedResponse,
  PaginatedDto,
} from '../dto/common/paginated.dto.js';
import { DeletedResponseDto } from '../dto/common/deleted-response.dto.js';
import { ToggleLikeResponseDto } from '../dto/common/toggle-like-response.dto.js';
import { PostResponseDto } from '../dto/post/post-response.dto.js';
import { PostService } from '../services/post.service.js';
import { PostWithCounts } from '../repositories/post.repository.js';
import { StorageService } from '../storage/storage.service.js';

const MAX_MEDIA_SIZE = 5 * 1024 * 1024; // 5 MB

@ApiTags('post')
@ApiBearerAuth()
@Controller('post')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly currentUser: CurrentUserService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  @ApiPaginatedResponse(PostResponseDto)
  async getPosts(
    @Query() query: GetPostsQueryDto,
  ): Promise<PaginatedDto<PostResponseDto>> {
    const { keycloakId } = await this.currentUser.getDbUser();
    const { items, total, page, limit } = await this.postService.list(
      query,
      keycloakId,
    );
    const data = await Promise.all(items.map((item) => this.present(item)));
    return { data, total, page, limit };
  }

  @Get(':id')
  @ApiOkResponse({ type: PostResponseDto })
  async getPost(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.present(await this.postService.getOne(id, keycloakId));
  }

  @Post()
  @ApiOkResponse({ type: PostResponseDto })
  async createPost(@Body() dto: CreatePostDto): Promise<PostResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.present(await this.postService.create(keycloakId, dto));
  }

  @Patch(':id')
  @ApiOkResponse({ type: PostResponseDto })
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.present(await this.postService.update(id, keycloakId, dto));
  }

  @Post(':id/media')
  @ApiOperation({
    summary: 'Upload or replace the post media',
    description:
      'Multipart upload (field `file`). Images only (png/jpeg/webp/gif), ' +
      'max 5 MB. Replaces any existing media; author only. Returns the post ' +
      'with a fresh presigned `mediaUrl`.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: PostResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_MEDIA_SIZE }),
          new FileTypeValidator({ fileType: /^image\/(png|jpe?g|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<PostResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.present(await this.postService.setMedia(id, keycloakId, file));
  }

  @Delete(':id/media')
  @ApiOperation({
    summary: 'Remove the post media',
    description:
      'Deletes the stored object and clears `mediaUrl` (author only). ' +
      'No-op if the post has no media.',
  })
  @ApiOkResponse({ type: PostResponseDto })
  async deleteMedia(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.present(await this.postService.clearMedia(id, keycloakId));
  }

  @Post('like/:id')
  @ApiOkResponse({ type: ToggleLikeResponseDto })
  async likePost(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ToggleLikeResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.postService.toggleLike(id, keycloakId);
  }

  @Delete(':id')
  @ApiOkResponse({ type: DeletedResponseDto })
  async deletePost(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeletedResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    await this.postService.remove(id, keycloakId);
    return { deleted: true };
  }

  /** Maps an entity to its response shape, presigning media + author avatar. */
  private async present(post: PostWithCounts): Promise<PostResponseDto> {
    const [mediaUrl, authorAvatarUrl] = await Promise.all([
      this.storage.presign(post.mediaKey),
      this.storage.presign(post.author.profileMediaKey),
    ]);
    return PostResponseDto.from(post, mediaUrl, authorAvatarUrl);
  }
}
