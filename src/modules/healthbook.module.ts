import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from './prisma.module.js';
import { CommentController } from '../controllers/comment.controller.js';
import { PostController } from '../controllers/post.controller.js';
import { UserController } from '../controllers/user.controller.js';
import { PostService } from '../services/post.service.js';
import { PostRepository } from '../repositories/post.repository.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [CommentController, PostController, UserController],
  providers: [PostService, PostRepository],
})
export class HealthbookModule {}
