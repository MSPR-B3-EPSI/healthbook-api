import { ApiProperty } from '@nestjs/swagger';

export class ToggleLikeResponseDto {
  @ApiProperty({ description: 'True if the like is now set, false if removed' })
  liked: boolean;

  @ApiProperty({ description: 'Like count after the toggle' })
  likesCount: number;
}
