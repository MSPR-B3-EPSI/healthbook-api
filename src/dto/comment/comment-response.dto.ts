import { ApiProperty } from '@nestjs/swagger';
import { CommentWithCounts } from '../../repositories/comment.repository.js';

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  likesCount: number;

  static from(this: void, c: CommentWithCounts): CommentResponseDto {
    return {
      id: c.id,
      postId: c.postId,
      content: c.content,
      authorId: c.authorId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      likesCount: c._count.likes,
    };
  }
}
