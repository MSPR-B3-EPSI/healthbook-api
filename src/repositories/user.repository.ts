import { Injectable } from '@nestjs/common';
import { PrismaService } from '../helpers/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { UserModel } from '../generated/prisma/models.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByKeycloakId(keycloakId: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({ where: { keycloakId } });
  }

  update(keycloakId: string, data: Prisma.UserUpdateInput): Promise<UserModel> {
    return this.prisma.user.update({ where: { keycloakId }, data });
  }
}
