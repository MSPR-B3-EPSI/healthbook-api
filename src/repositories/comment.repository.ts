import { Injectable } from '@nestjs/common';
import { PrismaService } from '../helpers/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

// Shared include so list/get/create/update all return the same shape (counts).
export const commentWithCountsInclude = {
  _count: { select: { likes: true } },
} satisfies Prisma.CommentInclude;

export type CommentWithCounts = Prisma.CommentGetPayload<{
  include: typeof commentWithCountsInclude;
}>;

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyWithCounts(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CommentWhereInput;
    orderBy?: Prisma.CommentOrderByWithRelationInput;
  }): Promise<CommentWithCounts[]> {
    return this.prisma.comment.findMany({
      ...params,
      include: commentWithCountsInclude,
    });
  }

  findUniqueWithCounts(id: string): Promise<CommentWithCounts | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: commentWithCountsInclude,
    });
  }

  create(data: Prisma.CommentCreateInput): Promise<CommentWithCounts> {
    return this.prisma.comment.create({
      data,
      include: commentWithCountsInclude,
    });
  }

  update(
    id: string,
    data: Prisma.CommentUpdateInput,
  ): Promise<CommentWithCounts> {
    return this.prisma.comment.update({
      where: { id },
      data,
      include: commentWithCountsInclude,
    });
  }

  count(where?: Prisma.CommentWhereInput): Promise<number> {
    return this.prisma.comment.count({ where });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.commentLike.deleteMany({ where: { commentId: id } });
      await tx.comment.delete({ where: { id } });
    });
  }

  // Like helpers honoring @@unique([userId, commentId]) (key: userId_commentId).
  findLike(userId: string, commentId: string) {
    return this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
  }

  createLike(userId: string, commentId: string) {
    return this.prisma.commentLike.create({ data: { userId, commentId } });
  }

  deleteLike(userId: string, commentId: string) {
    return this.prisma.commentLike.delete({
      where: { userId_commentId: { userId, commentId } },
    });
  }
}
