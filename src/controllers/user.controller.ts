import { Body, Controller, Patch, Post } from '@nestjs/common';
import {
  CreateCommentInput,
  CreatePostInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '../dto/user/user.dto.js';

@Controller('user')
export class UserController {
  @Post('register')
  register(@Body() input: RegisterInput): string {
    return 'register user';
  }

  @Post('login')
  login(@Body() input: LoginInput): string {
    return 'login user';
  }

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
