import { ApiProperty } from '@nestjs/swagger';

/** Minimal author embedded in post/comment responses (avoids client N+1). */
export class AuthorDto {
  @ApiProperty()
  keycloakId: string;

  @ApiProperty({ required: false, nullable: true })
  username: string | null;

  @ApiProperty({ required: false, nullable: true })
  displayName: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Short-lived presigned URL to the author avatar, or null',
  })
  profilePictureUrl: string | null;
}
