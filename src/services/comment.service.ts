import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommentRepository,
  CommentWithCounts,
} from '../repositories/comment.repository.js';
import { PostRepository } from '../repositories/post.repository.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreateCommentDTO } from '../dto/comment/create-comment.dto.js';
import { UpdateCommentDTO } from '../dto/comment/update-comment.dto.js';
import {
  CommentSortBy,
  GetCommentsQueryDto,
} from '../dto/comment/get-comments-query.dto.js';
import { SortOrder } from '../dto/common/sort-order.enum.js';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepo: CommentRepository,
    private readonly postRepo: PostRepository,
  ) {}

  async create(
    authorId: string,
    dto: CreateCommentDTO,
  ): Promise<CommentWithCounts> {
    const post = await this.postRepo.findUniqueWithCounts(dto.postId);
    if (!post) throw new NotFoundException('Post introuvable');
    return this.commentRepo.create({
      content: dto.content,
      post: { connect: { id: dto.postId } },
      author: { connect: { keycloakId: authorId } },
    });
  }

  async list(query: GetCommentsQueryDto): Promise<{
    items: CommentWithCounts[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);
    const orderBy = this.buildOrderBy(
      query.sortBy ?? CommentSortBy.CreatedAt,
      query.sortOrder ?? SortOrder.Desc,
    );

    const [items, total] = await Promise.all([
      this.commentRepo.findManyWithCounts({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy,
      }),
      this.commentRepo.count(where),
    ]);

    return { items, total, page, limit };
  }

  private buildWhere(query: GetCommentsQueryDto): Prisma.CommentWhereInput {
    const where: Prisma.CommentWhereInput = { postId: query.postId };

    if (query.authorId) where.authorId = query.authorId;

    if (query.search) {
      where.content = { contains: query.search, mode: 'insensitive' };
    }

    return where;
  }

  private buildOrderBy(
    sortBy: CommentSortBy,
    sortOrder: SortOrder,
  ): Prisma.CommentOrderByWithRelationInput {
    switch (sortBy) {
      case CommentSortBy.Likes:
        return { likes: { _count: sortOrder } };
      case CommentSortBy.UpdatedAt:
        return { updatedAt: sortOrder };
      case CommentSortBy.CreatedAt:
      default:
        return { createdAt: sortOrder };
    }
  }

  async getOne(id: string): Promise<CommentWithCounts> {
    const comment = await this.commentRepo.findUniqueWithCounts(id);
    if (!comment) throw new NotFoundException('Commentaire introuvable');
    return comment;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCommentDTO,
  ): Promise<CommentWithCounts> {
    await this.assertOwner(id, userId);
    return this.commentRepo.update(id, { content: dto.content });
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.assertOwner(id, userId);
    await this.commentRepo.delete(id);
  }

  // Single endpoint toggles like/unlike, honoring the unique (userId, commentId).
  async toggleLike(
    id: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    const comment = await this.commentRepo.findUniqueWithCounts(id);
    if (!comment) throw new NotFoundException('Commentaire introuvable');

    const existing = await this.commentRepo.findLike(userId, id);
    if (existing) {
      await this.commentRepo.deleteLike(userId, id);
      return { liked: false, likesCount: comment._count.likes - 1 };
    }
    await this.commentRepo.createLike(userId, id);
    return { liked: true, likesCount: comment._count.likes + 1 };
  }

  private async assertOwner(
    id: string,
    userId: string,
  ): Promise<CommentWithCounts> {
    const comment = await this.commentRepo.findUniqueWithCounts(id);
    if (!comment) throw new NotFoundException('Commentaire introuvable');
    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas l'auteur de ce commentaire",
      );
    }
    return comment;
  }
}
