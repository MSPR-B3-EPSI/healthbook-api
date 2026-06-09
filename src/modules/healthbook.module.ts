import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CommentController } from '../controllers/comment.controller.js';
import { PostController } from '../controllers/post.controller.js';
import { UserController } from '../controllers/user.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [CommentController, PostController, UserController],
})
export class HealthbookModule {}
