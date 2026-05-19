import { ApiProperty } from '@nestjs/swagger';
import { JwtPayloadDto } from './jwt-payload.dto.js';

export class UserDto {
  @ApiProperty()
  keycloakId: string;

  @ApiProperty({ required: false, nullable: true })
  email: string | null;

  @ApiProperty({ required: false, nullable: true })
  username: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class WhoamiResponseDto {
  @ApiProperty({ type: UserDto })
  dbuser: UserDto;

  @ApiProperty({ type: JwtPayloadDto })
  jwtuser: JwtPayloadDto;
}
