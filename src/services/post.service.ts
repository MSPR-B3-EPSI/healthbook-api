import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PostRepository,
  PostWithCounts,
} from '../repositories/post.repository.js';
import { CreatePostDto } from '../dto/post/create-post.dto.js';
import { UpdatePostDto } from '../dto/post/update-post.dto.js';
import { GetPostsQueryDto } from '../dto/post/get-posts-query.dto.js';

@Injectable()
export class PostService {
  constructor(private readonly postRepo: PostRepository) {}

  create(authorId: string, dto: CreatePostDto): Promise<PostWithCounts> {
    return this.postRepo.create({
      title: dto.title,
      content: dto.content,
      mediaUrl: dto.mediaUrl,
      author: { connect: { keycloakId: authorId } },
    });
  }

  async list(query: GetPostsQueryDto): Promise<{
    items: PostWithCounts[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.authorId ? { authorId: query.authorId } : undefined;

    const [items, total] = await Promise.all([
      this.postRepo.findManyWithCounts({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.postRepo.count(where),
    ]);

    return { items, total, page, limit };
  }

  async getOne(id: string): Promise<PostWithCounts> {
    const post = await this.postRepo.findUniqueWithCounts(id);
    if (!post) throw new NotFoundException('Post introuvable');
    return post;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePostDto,
  ): Promise<PostWithCounts> {
    await this.assertOwner(id, userId);
    return this.postRepo.update(id, {
      title: dto.title,
      content: dto.content,
      mediaUrl: dto.mediaUrl,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.assertOwner(id, userId);
    await this.postRepo.delete(id);
  }

  // Single endpoint toggles like/unlike, honoring the unique (userId, postId).
  async toggleLike(
    id: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    const post = await this.postRepo.findUniqueWithCounts(id);
    if (!post) throw new NotFoundException('Post introuvable');

    const existing = await this.postRepo.findLike(userId, id);
    if (existing) {
      await this.postRepo.deleteLike(userId, id);
      return { liked: false, likesCount: post._count.likes - 1 };
    }
    await this.postRepo.createLike(userId, id);
    return { liked: true, likesCount: post._count.likes + 1 };
  }

  private async assertOwner(id: string, userId: string): Promise<void> {
    const post = await this.postRepo.findUniqueWithCounts(id);
    if (!post) throw new NotFoundException('Post introuvable');
    if (post.authorId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas l'auteur de ce post");
    }
  }
}
