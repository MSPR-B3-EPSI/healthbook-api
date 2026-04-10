import { Controller, Get, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { PostService } from '../services/post.service.js';
import { Post as PostModel } from '../generated/prisma/client.js';

@Controller('post')
export class PostController {
  constructor(private postService: PostService) {}

  @Get(':id')
  getPost(@Param('id') id: string): Promise<PostModel | null> {
    return this.postService.getPost({ id: Number(id) });
  }

  @Get()
  getPublished(): Promise<PostModel[]> {
    return this.postService.getPosts({ where: { published: true } });
  }

  @Get('search/:query')
  getFiltered(@Param('query') query: string): Promise<PostModel[]> {
    return this.postService.getPosts({
      where: {
        OR: [{ title: { contains: query } }, { content: { contains: query } }],
      },
    });
  }

  @Post()
  create(
    @Body() data: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    return this.postService.createPost({
      title: data.title,
      content: data.content,
      author: { connect: { email: data.authorEmail } },
    });
  }

  @Put(':id/publish')
  publish(@Param('id') id: string): Promise<PostModel> {
    return this.postService.updatePost({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<PostModel> {
    return this.postService.deletePost({ id: Number(id) });
  }
}
