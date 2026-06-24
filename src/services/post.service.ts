import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PostRepository,
  PostWithCounts,
} from '../repositories/post.repository.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreatePostDto } from '../dto/post/create-post.dto.js';
import { UpdatePostDto } from '../dto/post/update-post.dto.js';
import {
  GetPostsQueryDto,
  PostSortBy,
} from '../dto/post/get-posts-query.dto.js';
import { SortOrder } from '../dto/common/sort-order.enum.js';
import { StorageService } from '../storage/storage.service.js';

@Injectable()
export class PostService {
  constructor(
    private readonly postRepo: PostRepository,
    private readonly storage: StorageService,
  ) {}

  create(authorId: string, dto: CreatePostDto): Promise<PostWithCounts> {
    return this.postRepo.create({
      title: dto.title,
      content: dto.content,
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
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(
      query.sortBy ?? PostSortBy.CreatedAt,
      query.sortOrder ?? SortOrder.Desc,
    );

    const [items, total] = await Promise.all([
      this.postRepo.findManyWithCounts({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy,
      }),
      this.postRepo.count(where),
    ]);

    return { items, total, page, limit };
  }

  private buildWhere(query: GetPostsQueryDto): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {};

    if (query.authorId) where.authorId = query.authorId;

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.hasMedia !== undefined) {
      where.mediaKey = query.hasMedia ? { not: null } : null;
    }

    if (query.createdAfter || query.createdBefore) {
      where.createdAt = {
        ...(query.createdAfter ? { gte: new Date(query.createdAfter) } : {}),
        ...(query.createdBefore ? { lte: new Date(query.createdBefore) } : {}),
      };
    }

    return where;
  }

  private buildOrderBy(
    sortBy: PostSortBy,
    sortOrder: SortOrder,
  ): Prisma.PostOrderByWithRelationInput {
    switch (sortBy) {
      case PostSortBy.Likes:
        return { likes: { _count: sortOrder } };
      case PostSortBy.Comments:
        return { comments: { _count: sortOrder } };
      case PostSortBy.Title:
        return { title: sortOrder };
      case PostSortBy.UpdatedAt:
        return { updatedAt: sortOrder };
      case PostSortBy.CreatedAt:
      default:
        return { createdAt: sortOrder };
    }
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
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const post = await this.assertOwner(id, userId);
    await this.postRepo.delete(id);
    if (post.mediaKey) await this.storage.delete(post.mediaKey);
  }

  /** Uploads (or replaces) the post media, returning the updated post. */
  async setMedia(
    id: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<PostWithCounts> {
    const post = await this.assertOwner(id, userId);
    const key = await this.storage.put(file);
    const updated = await this.postRepo.update(id, { mediaKey: key });
    if (post.mediaKey) await this.storage.delete(post.mediaKey);
    return updated;
  }

  /** Removes the post media (object + reference), returning the updated post. */
  async clearMedia(id: string, userId: string): Promise<PostWithCounts> {
    const post = await this.assertOwner(id, userId);
    if (!post.mediaKey) return post;
    const updated = await this.postRepo.update(id, { mediaKey: null });
    await this.storage.delete(post.mediaKey);
    return updated;
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

  private async assertOwner(
    id: string,
    userId: string,
  ): Promise<PostWithCounts> {
    const post = await this.postRepo.findUniqueWithCounts(id);
    if (!post) throw new NotFoundException('Post introuvable');
    if (post.authorId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas l'auteur de ce post");
    }
    return post;
  }
}
