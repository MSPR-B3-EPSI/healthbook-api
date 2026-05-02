import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {
    super();
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    console.log('jwtAuth canactivate');
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;
    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string> }>();
    const authHeader = req.headers['authorization'];
    console.log('Authorization header prefix:', authHeader?.substring(0, 15));
    let result: boolean;
    try {
      result = await (super.canActivate(ctx) as Promise<boolean>);
    } catch (err: unknown) {
      console.log('JWT validation error:', (err as Error).message);

      throw err;
    }
    console.log('result:', result);
    if (result) {
      console.log('result exist :', result);
      const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
      this.cls.set('user', request.user);
    }
    return result;
  }
}
