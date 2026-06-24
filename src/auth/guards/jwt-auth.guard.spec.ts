import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { JwtAuthGuard } from './jwt-auth.guard.js';

function contextWithRequest(req: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let cls: { set: jest.Mock; get: jest.Mock };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    cls = { set: jest.fn(), get: jest.fn() };
    guard = new JwtAuthGuard(reflector, cls as unknown as ClsService);
  });

  it('laisse passer une route @Public() sans vérifier de jeton', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    const result = await guard.canActivate(contextWithRequest({ headers: {} }));

    expect(result).toBe(true);
    expect(cls.set).not.toHaveBeenCalled();
  });
});
