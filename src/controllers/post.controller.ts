import {
  Body,
  Controller,
  Delete,
  Get,
  NotImplementedException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CurrentUserService } from '../auth/services/current-user.service.js';
import { CreatePostDto } from '../dto/post/create-post.dto.js';
import { GetPostsQueryDto } from '../dto/post/get-posts-query.dto.js';
import { UpdatePostDto } from '../dto/post/update-post.dto.js';

@Controller('post')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostController {
  constructor(private readonly currentUser: CurrentUserService) {}

  @Get()
  getPosts(@Query() _query: GetPostsQueryDto) {
    throw new NotImplementedException();
  }

  @Get(':id')
  getPost(@Param('id', ParseUUIDPipe) _id: string) {
    throw new NotImplementedException();
  }

  @Post()
  createPost(@Body() _dto: CreatePostDto) {
    throw new NotImplementedException();
  }

  @Patch(':id')
  updatePost(
    @Param('id', ParseUUIDPipe) _id: string,
    @Body() _dto: UpdatePostDto,
  ) {
    throw new NotImplementedException();
  }

  @Post('like/:id')
  likePost(@Param('id', ParseUUIDPipe) _id: string) {
    throw new NotImplementedException();
  }

  @Delete(':id')
  deletePost(@Param('id', ParseUUIDPipe) _id: string) {
    throw new NotImplementedException();
  }
}
