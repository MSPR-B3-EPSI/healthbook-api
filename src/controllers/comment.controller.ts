import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUserService } from '../auth/services/current-user.service.js';
import { CreateCommentDTO } from '../dto/comment/create-comment.dto.js';
import { GetCommentsQueryDto } from '../dto/comment/get-comments-query.dto.js';
import { UpdateCommentDTO } from '../dto/comment/update-comment.dto.js';
import {
  ApiPaginatedResponse,
  PaginatedDto,
} from '../dto/common/paginated.dto.js';
import { DeletedResponseDto } from '../dto/common/deleted-response.dto.js';
import { ToggleLikeResponseDto } from '../dto/common/toggle-like-response.dto.js';
import { CommentResponseDto } from '../dto/comment/comment-response.dto.js';
import { CommentService } from '../services/comment.service.js';

@ApiTags('comment')
@ApiBearerAuth()
@Controller('comment')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly currentUser: CurrentUserService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List a post’s comments (paginated)' })
  @ApiPaginatedResponse(CommentResponseDto)
  async getComments(
    @Query() query: GetCommentsQueryDto,
  ): Promise<PaginatedDto<CommentResponseDto>> {
    const { items, total, page, limit } = await this.commentService.list(query);
    return { data: items.map(CommentResponseDto.from), total, page, limit };
  }

  @Get(':id')
  @ApiOkResponse({ type: CommentResponseDto })
  async getComment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommentResponseDto> {
    return CommentResponseDto.from(await this.commentService.getOne(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create a comment on a post' })
  @ApiOkResponse({ type: CommentResponseDto })
  async createComment(
    @Body() dto: CreateCommentDTO,
  ): Promise<CommentResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return CommentResponseDto.from(
      await this.commentService.create(keycloakId, dto),
    );
  }

  @Patch(':id')
  @ApiOkResponse({ type: CommentResponseDto })
  async updateComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommentDTO,
  ): Promise<CommentResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return CommentResponseDto.from(
      await this.commentService.update(id, keycloakId, dto),
    );
  }

  @Post('like/:id')
  @ApiOperation({ summary: 'Toggle like on a comment' })
  @ApiOkResponse({ type: ToggleLikeResponseDto })
  async likeComment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ToggleLikeResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.commentService.toggleLike(id, keycloakId);
  }

  @Delete(':id')
  @ApiOkResponse({ type: DeletedResponseDto })
  async deleteComment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeletedResponseDto> {
    const { keycloakId } = await this.currentUser.getDbUser();
    await this.commentService.remove(id, keycloakId);
    return { deleted: true };
  }
}
