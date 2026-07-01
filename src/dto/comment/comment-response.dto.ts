import { ApiProperty } from '@nestjs/swagger';
import { CommentWithCounts } from '../../repositories/comment.repository.js';
import { AuthorDto } from '../common/author.dto.js';

export class CommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  postId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  likesCount: number;

  @ApiProperty({
    description: 'Whether the current user has liked this comment',
  })
  likedByMe: boolean;

  static from(
    this: void,
    c: CommentWithCounts,
    authorAvatarUrl: string | null,
  ): CommentResponseDto {
    return {
      id: c.id,
      postId: c.postId,
      content: c.content,
      authorId: c.authorId,
      author: {
        keycloakId: c.author.keycloakId,
        username: c.author.username,
        displayName: c.author.displayName,
        profilePictureUrl: authorAvatarUrl,
      },
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      likesCount: c._count.likes,
      likedByMe: c.likes.length > 0,
    };
  }
}
