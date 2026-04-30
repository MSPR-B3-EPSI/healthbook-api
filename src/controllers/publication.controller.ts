import { Controller, Get, Param, Post, Body, Put, Delete } from '@nestjs/common';
import { PublicationService } from '../services/publication.service.js';
import { Post as PostModel } from '../generated/prisma/client.js';

@Controller('publication')
export class PublicationController {
  constructor(private publicationService: PublicationService) {}

  @Get(':id')
  getPost(@Param('id') id: string): Promise<PostModel | null> {
    return this.publicationService.getPost({ id: Number(id) });
  }

  @Get()
  getPublished(): Promise<PostModel[]> {
    return this.publicationService.getPosts({ where: { published: true } });
  }

  @Get('search/:query')
  getFiltered(@Param('query') query: string): Promise<PostModel[]> {
    return this.publicationService.getPosts({
      where: {
        OR: [{ title: { contains: query } }, { content: { contains: query } }],
      },
    });
  }

  @Post()
  create(
    @Body() data: { title: string; content?: string; authorEmail: string },
  ): Promise<PostModel> {
    return this.publicationService.createPost({
      title: data.title,
      content: data.content,
      author: { connect: { email: data.authorEmail } },
    });
  }

  @Put(':id/publish')
  publish(@Param('id') id: string): Promise<PostModel> {
    return this.publicationService.updatePost({
      where: { id: Number(id) },
      data: { published: true },
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string): Promise<PostModel> {
    return this.publicationService.deletePost({ id: Number(id) });
  }
}
