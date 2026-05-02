import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import type { JwtPayload } from '../types/jwt-payload.type.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const issuer = config.getOrThrow<string>('KEYCLOAK_ISSUER');
    const audience = config.getOrThrow<string>('KEYCLOAK_AUDIENCE');
    const jwksUri =
      config.get<string>('KEYCLOAK_JWKS_URI') ??
      `${issuer}/protocol/openid-connect/certs`;

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
      jwtFromRequest: (req: Request) => {
        const header: string | undefined = req.headers['authorization'] as
          | string
          | undefined;
        if (!header) return null;
        return header.startsWith('Bearer ')
          ? header.replace('Bearer ', '')
          : header;
      },
      issuer,
      audience,
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
