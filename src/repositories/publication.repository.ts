import { Injectable } from '@nestjs/common';
import { PrismaService } from '../helpers/prisma.service.js';
import { Post, Prisma } from '../generated/prisma/client.js';

@Injectable()
export class PublicationRepository {
  constructor(private prisma: PrismaService) {}

  findUnique(where: Prisma.PostWhereUniqueInput): Promise<Post | null> {
    return this.prisma.post.findUnique({ where });
  }

  findMany(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    return this.prisma.post.findMany(params);
  }

  create(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({ data });
  }

  update(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    return this.prisma.post.update(params);
  }

  delete(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.prisma.post.delete({ where });
  }
}
