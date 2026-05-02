import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';
import { Role, ROLE_HIERARCHY } from '../types/roles.enum.js';

function meetsRole(userRoles: string[], required: string): boolean {
  const requiredLevel = ROLE_HIERARCHY.indexOf(required as Role);

  if (requiredLevel === -1) return false;

  return userRoles.some(
    (r) => ROLE_HIERARCHY.indexOf(r as Role) >= requiredLevel,
  );
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!required?.length) return true;

    const { user } = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    const userRoles = user?.realm_access?.roles ?? [];
    const hasRole = required.some((role) => meetsRole(userRoles, role));

    if (!hasRole) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
