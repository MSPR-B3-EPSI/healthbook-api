import { Injectable } from '@nestjs/common';
import { PrismaService } from '../helpers/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

// Shape backing the response type: counts, embedded author, and the marker rows
// for "liked by the current user" (the query filters `likes` to that user).
const postMetaShape = {
  _count: { select: { likes: true, comments: true } },
  author: {
    select: {
      keycloakId: true,
      username: true,
      displayName: true,
      profileMediaKey: true,
    },
  },
  likes: { select: { id: true } },
} satisfies Prisma.PostInclude;

export type PostWithCounts = Prisma.PostGetPayload<{
  include: typeof postMetaShape;
}>;

// Query include: same selected fields, but `likes` is filtered to the current
// user (so `likes.length > 0` ⇔ liked by me). `take: 1` keeps it cheap.
const postMetaInclude = (userId: string) =>
  ({
    ...postMetaShape,
    likes: { where: { userId }, select: { id: true }, take: 1 },
  }) satisfies Prisma.PostInclude;

@Injectable()
export class PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyWithCounts(
    userId: string,
    params: {
      skip?: number;
      take?: number;
      where?: Prisma.PostWhereInput;
      orderBy?: Prisma.PostOrderByWithRelationInput;
    },
  ): Promise<PostWithCounts[]> {
    return this.prisma.post.findMany({
      ...params,
      include: postMetaInclude(userId),
    });
  }

  findUniqueWithCounts(
    id: string,
    userId: string,
  ): Promise<PostWithCounts | null> {
    return this.prisma.post.findUnique({
      where: { id },
      include: postMetaInclude(userId),
    });
  }

  create(
    data: Prisma.PostCreateInput,
    userId: string,
  ): Promise<PostWithCounts> {
    return this.prisma.post.create({
      data,
      include: postMetaInclude(userId),
    });
  }

  update(
    id: string,
    data: Prisma.PostUpdateInput,
    userId: string,
  ): Promise<PostWithCounts> {
    return this.prisma.post.update({
      where: { id },
      data,
      include: postMetaInclude(userId),
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
