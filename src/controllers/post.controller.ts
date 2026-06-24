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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUserService } from '../auth/services/current-user.service.js';
import { CreatePostDto } from '../dto/post/create-post.dto.js';
import { GetPostsQueryDto } from '../dto/post/get-posts-query.dto.js';
import { UpdatePostDto } from '../dto/post/update-post.dto.js';
import { PostService } from '../services/post.service.js';
import { PostWithCounts } from '../repositories/post.repository.js';

@Controller('post')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly currentUser: CurrentUserService,
  ) {}

  @Get()
  async getPosts(@Query() query: GetPostsQueryDto) {
    const { items, total, page, limit } = await this.postService.list(query);
    return { data: items.map((p) => this.toResponse(p)), total, page, limit };
  }

  @Get(':id')
  async getPost(@Param('id', ParseUUIDPipe) id: string) {
    return this.toResponse(await this.postService.getOne(id));
  }

  @Post()
  async createPost(@Body() dto: CreatePostDto) {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.toResponse(await this.postService.create(keycloakId, dto));
  }

  @Patch(':id')
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ) {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.toResponse(await this.postService.update(id, keycloakId, dto));
  }

  @Post('like/:id')
  async likePost(@Param('id', ParseUUIDPipe) id: string) {
    const { keycloakId } = await this.currentUser.getDbUser();
    return this.postService.toggleLike(id, keycloakId);
  }

  @Delete(':id')
  async deletePost(@Param('id', ParseUUIDPipe) id: string) {
    const { keycloakId } = await this.currentUser.getDbUser();
    await this.postService.remove(id, keycloakId);
    return { deleted: true };
  }

  private toResponse(p: PostWithCounts) {
    return {
      id: p.id,
      title: p.title,
      content: p.content,
      mediaUrl: p.mediaUrl,
      authorId: p.authorId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
    };
  }
}
