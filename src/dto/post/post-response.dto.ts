import { ApiProperty } from '@nestjs/swagger';
import { PostWithCounts } from '../../repositories/post.repository.js';

export class PostResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Short-lived presigned URL to the media, or null',
  })
  mediaUrl: string | null;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  commentsCount: number;

  static from(
    this: void,
    p: PostWithCounts,
    mediaUrl: string | null,
  ): PostResponseDto {
    return {
      id: p.id,
      title: p.title,
      content: p.content,
      mediaUrl,
      authorId: p.authorId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
    };
  }
}
