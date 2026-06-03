import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../types/jwt-payload.type.js';

export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    return field ? request.user?.[field] : request.user;
  },
);
