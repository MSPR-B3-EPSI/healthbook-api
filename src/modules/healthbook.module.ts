import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from './prisma.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { CommentController } from '../controllers/comment.controller.js';
import { PostController } from '../controllers/post.controller.js';
import { UserController } from '../controllers/user.controller.js';
import { PostService } from '../services/post.service.js';
import { PostRepository } from '../repositories/post.repository.js';
import { CommentService } from '../services/comment.service.js';
import { CommentRepository } from '../repositories/comment.repository.js';
import { UserService } from '../services/user.service.js';
import { UserRepository } from '../repositories/user.repository.js';

@Module({
  imports: [AuthModule, PrismaModule, StorageModule],
  controllers: [CommentController, PostController, UserController],
  providers: [
    PostService,
    PostRepository,
    CommentService,
    CommentRepository,
    UserService,
    UserRepository,
  ],
})
export class HealthbookModule {}
