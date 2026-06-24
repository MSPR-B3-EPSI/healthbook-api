import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Role } from '../../src/auth/types/roles.enum.js';
import type { JwtPayload } from '../../src/auth/types/jwt-payload.type.js';

export const TEST_USER: JwtPayload = {
  sub: '11111111-1111-4111-8111-111111111111',
  preferred_username: 'tester',
  email: 'tester@example.com',
  realm_access: { roles: [Role.Premium] },
};

export const OTHER_USER: JwtPayload = {
  sub: '22222222-2222-4222-8222-222222222222',
  preferred_username: 'intruder',
  email: 'intruder@example.com',
  realm_access: { roles: [Role.Premium] },
};

// Remplace JwtAuthGuard en e2e : pas de jeton Keycloak à signer, on injecte
// simplement un utilisateur connu (modifiable via setCurrentUser pour les cas 403).
@Injectable()
export class FakeJwtAuthGuard implements CanActivate {
  private static current: JwtPayload = TEST_USER;

  constructor(private readonly cls: ClsService) {}

  static setCurrentUser(user: JwtPayload): void {
    FakeJwtAuthGuard.current = user;
  }

  static reset(): void {
    FakeJwtAuthGuard.current = TEST_USER;
  }

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    req.user = FakeJwtAuthGuard.current;
    this.cls.set('user', FakeJwtAuthGuard.current);
    return true;
  }
}
