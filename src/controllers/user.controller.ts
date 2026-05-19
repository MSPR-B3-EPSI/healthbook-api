import { Body, Controller, Patch, Post } from '@nestjs/common';
import {
  CreateCommentInput,
  CreatePostInput,
  UpdateProfileInput,
} from '../dto/user/user.dto.js';

@Controller('user')
export class UserController {
  @Post('posts')
  createPost(@Body() input: CreatePostInput): string {
    return 'create post';
  }

  @Post('comments')
  createComment(@Body() input: CreateCommentInput): string {
    return 'create comment';
  }

  @Patch('profile')
  updateProfile(@Body() input: UpdateProfileInput): string {
    return 'update profile';
  }
}
