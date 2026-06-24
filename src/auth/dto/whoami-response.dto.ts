import { ApiProperty } from '@nestjs/swagger';
import { JwtPayloadDto } from './jwt-payload.dto.js';
import { UserResponseDto } from '../../dto/user/user-response.dto.js';

export class WhoamiResponseDto {
  @ApiProperty({ type: UserResponseDto })
  dbuser: UserResponseDto;

  @ApiProperty({ type: JwtPayloadDto })
  jwtuser: JwtPayloadDto;
}
