import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { Role } from '../types/roles.enum.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';

function contextWithUser(user?: Partial<JwtPayload>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  it('autorise quand aucun rôle n’est requis', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(contextWithUser())).toBe(true);
  });

  it('autorise quand l’utilisateur possède exactement le rôle requis', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.Premium]);
    const ctx = contextWithUser({ realm_access: { roles: [Role.Premium] } });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('autorise quand l’utilisateur a un rôle supérieur dans la hiérarchie', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.Freemium]);
    const ctx = contextWithUser({
      realm_access: { roles: [Role.PremiumPlus] },
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('refuse (403) quand le rôle de l’utilisateur est insuffisant', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.PremiumPlus]);
    const ctx = contextWithUser({ realm_access: { roles: [Role.Freemium] } });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuse quand le rôle requis est inconnu de la hiérarchie', () => {
    reflector.getAllAndOverride.mockReturnValue(['role-inexistant']);
    const ctx = contextWithUser({
      realm_access: { roles: [Role.PremiumPlus] },
    });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuse quand realm_access est absent (aucun rôle)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.Freemium]);
    const ctx = contextWithUser({});

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
