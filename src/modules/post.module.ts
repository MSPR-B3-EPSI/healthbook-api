import { Module } from '@nestjs/common';
import { PostService } from '../services/post.service.js';
import { PostRepository } from '../repositories/post.repository.js';
import { PostController } from '../controllers/post.controller.js';
import { PrismaModule } from './prisma.module.js';
@Module({
  imports: [PrismaModule],
  controllers: [PostController],
  providers: [PostService, PostRepository],
  exports: [PostService],
})
export class PostModule {}
