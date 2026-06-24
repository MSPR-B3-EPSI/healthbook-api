import { ApiProperty } from '@nestjs/swagger';
import { UserModel } from '../../generated/prisma/models.js';

export class UserResponseDto {
  @ApiProperty()
  keycloakId: string;

  @ApiProperty({ required: false, nullable: true })
  email: string | null;

  @ApiProperty({ required: false, nullable: true })
  username: string | null;

  @ApiProperty({ required: false, nullable: true })
  displayName: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Short-lived presigned URL to the profile picture, or null',
  })
  profilePictureUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static from(
    this: void,
    u: UserModel,
    profilePictureUrl: string | null,
  ): UserResponseDto {
    return {
      keycloakId: u.keycloakId,
      email: u.email,
      username: u.username,
      displayName: u.displayName,
      profilePictureUrl,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }
}
