import { Injectable } from '@nestjs/common';
import { PrismaService } from '../helpers/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

// Shape backing the response type: like count, embedded author, and the marker
// rows for "liked by the current user" (the query filters `likes` to that user).
const commentMetaShape = {
  _count: { select: { likes: true } },
  author: {
    select: {
      keycloakId: true,
      username: true,
      displayName: true,
      profileMediaKey: true,
    },
  },
  likes: { select: { id: true } },
} satisfies Prisma.CommentInclude;

export type CommentWithCounts = Prisma.CommentGetPayload<{
  include: typeof commentMetaShape;
}>;

// Query include: same selected fields, but `likes` is filtered to the current
// user (so `likes.length > 0` ⇔ liked by me).
const commentMetaInclude = (userId: string) =>
  ({
    ...commentMetaShape,
    likes: { where: { userId }, select: { id: true }, take: 1 },
  }) satisfies Prisma.CommentInclude;

@Injectable()
export class CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyWithCounts(
    userId: string,
    params: {
      skip?: number;
      take?: number;
      where?: Prisma.CommentWhereInput;
      orderBy?: Prisma.CommentOrderByWithRelationInput;
    },
  ): Promise<CommentWithCounts[]> {
    return this.prisma.comment.findMany({
      ...params,
      include: commentMetaInclude(userId),
    });
  }

  findUniqueWithCounts(
    id: string,
    userId: string,
  ): Promise<CommentWithCounts | null> {
    return this.prisma.comment.findUnique({
      where: { id },
      include: commentMetaInclude(userId),
    });
  }

  create(
    data: Prisma.CommentCreateInput,
    userId: string,
  ): Promise<CommentWithCounts> {
    return this.prisma.comment.create({
      data,
      include: commentMetaInclude(userId),
    });
  }

  update(
    id: string,
    data: Prisma.CommentUpdateInput,
    userId: string,
  ): Promise<CommentWithCounts> {
    return this.prisma.comment.update({
      where: { id },
      data,
      include: commentMetaInclude(userId),
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
