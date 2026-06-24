import { Injectable } from '@nestjs/common';
import { PrismaService } from '../helpers/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

// Shared include so list/get/create/update all return the same shape (counts).
export const postWithCountsInclude = {
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostInclude;

export type PostWithCounts = Prisma.PostGetPayload<{
  include: typeof postWithCountsInclude;
}>;

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyWithCounts(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<PostWithCounts[]> {
    return this.prisma.post.findMany({
      ...params,
      include: postWithCountsInclude,
    });
  }

  findUniqueWithCounts(id: string): Promise<PostWithCounts | null> {
    return this.prisma.post.findUnique({
      where: { id },
      include: postWithCountsInclude,
    });
  }

  create(data: Prisma.PostCreateInput): Promise<PostWithCounts> {
    return this.prisma.post.create({ data, include: postWithCountsInclude });
  }

  update(id: string, data: Prisma.PostUpdateInput): Promise<PostWithCounts> {
    return this.prisma.post.update({
      where: { id },
      data,
      include: postWithCountsInclude,
    });
  }

  count(where?: Prisma.PostWhereInput): Promise<number> {
    return this.prisma.post.count({ where });
  }
  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.commentLike.deleteMany({ where: { comment: { postId: id } } });
      await tx.comment.deleteMany({ where: { postId: id } });
      await tx.postLike.deleteMany({ where: { postId: id } });
      await tx.post.delete({ where: { id } });
    });
  }

  // Like helpers honoring @@unique([userId, postId]) (compound key: userId_postId).
  findLike(userId: string, postId: string) {
    return this.prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });
  }

  createLike(userId: string, postId: string) {
    return this.prisma.postLike.create({ data: { userId, postId } });
  }

  deleteLike(userId: string, postId: string) {
    return this.prisma.postLike.delete({
      where: { userId_postId: { userId, postId } },
    });
  }
}
