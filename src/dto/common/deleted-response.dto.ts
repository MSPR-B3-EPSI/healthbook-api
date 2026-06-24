import { ApiProperty } from '@nestjs/swagger';

export class DeletedResponseDto {
  @ApiProperty({ default: true })
  deleted: boolean;
}
