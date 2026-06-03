import { ApiProperty } from '@nestjs/swagger';

export class RealmAccessDto {
  @ApiProperty({ type: [String] })
  roles: string[];
}

export class JwtPayloadDto {
  @ApiProperty()
  sub: string;

  @ApiProperty({ required: false })
  preferred_username?: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false, type: RealmAccessDto })
  realm_access?: RealmAccessDto;

  @ApiProperty({ required: false })
  resource_access?: Record<string, { roles: string[] }>;

  @ApiProperty({
    required: false,
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  aud?: string | string[];
}
