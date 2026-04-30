import { Injectable } from '@nestjs/common';
import { PublicationRepository } from '../repositories/publication.repository.js';
import { Post, Prisma } from '../generated/prisma/client.js';

@Injectable()
export class PublicationService {
  constructor(private postRepo: PublicationRepository) {}

  getPost(where: Prisma.PostWhereUniqueInput): Promise<Post | null> {
    return this.postRepo.findUnique(where);
  }

  getPosts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<Post[]> {
    return this.postRepo.findMany(params);
  }

  createPost(data: Prisma.PostCreateInput): Promise<Post> {
    return this.postRepo.create(data);
  }

  updatePost(params: {
    where: Prisma.PostWhereUniqueInput;
    data: Prisma.PostUpdateInput;
  }): Promise<Post> {
    return this.postRepo.update(params);
  }

  deletePost(where: Prisma.PostWhereUniqueInput): Promise<Post> {
    return this.postRepo.delete(where);
  }
}
