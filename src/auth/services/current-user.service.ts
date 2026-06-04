import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from '../../helpers/prisma.service.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';
import type { UserModel } from '../../generated/prisma/models.js';

@Injectable()
export class CurrentUserService {
  constructor(
    private readonly cls: ClsService,
    private readonly prisma: PrismaService,
  ) {
    console.log('user ??');
  }

  get jwtUser(): JwtPayload {
    return this.cls.get<JwtPayload>('user');
  }

  async getDbUser(): Promise<UserModel> {
    const cached = this.cls.get('dbUser') as UserModel | undefined;
    if (cached !== undefined) return cached;

    const { sub, email, preferred_username } = this.jwtUser;

    const dbUser = await this.prisma.user.upsert({
      where: { keycloakId: sub },
      update: { email, username: preferred_username },
      create: { keycloakId: sub, email, username: preferred_username },
    });

    this.cls.set('dbUser', dbUser);
    return dbUser;
  }
}
