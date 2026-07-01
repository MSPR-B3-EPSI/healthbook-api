import { ApiProperty } from '@nestjs/swagger';
import { PostWithCounts } from '../../repositories/post.repository.js';
import { AuthorDto } from '../common/author.dto.js';

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

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  commentsCount: number;

  @ApiProperty({ description: 'Whether the current user has liked this post' })
  likedByMe: boolean;

  static from(
    this: void,
    p: PostWithCounts,
    mediaUrl: string | null,
    authorAvatarUrl: string | null,
  ): PostResponseDto {
    return {
      id: p.id,
      title: p.title,
      content: p.content,
      mediaUrl,
      authorId: p.authorId,
      author: {
        keycloakId: p.author.keycloakId,
        username: p.author.username,
        displayName: p.author.displayName,
        profilePictureUrl: authorAvatarUrl,
      },
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      likedByMe: p.likes.length > 0,
    };
  }
}
