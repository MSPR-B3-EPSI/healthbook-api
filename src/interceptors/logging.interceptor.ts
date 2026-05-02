import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const { method, originalUrl, headers } = req;
    const authHeader = headers['authorization'];
    const authInfo = authHeader
      ? `Bearer ${authHeader.substring(7, 22)}...`
      : 'none';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = ctx.switchToHttp().getResponse<{ statusCode: number }>();
        this.logger.log(
          `${method} ${originalUrl} ${res.statusCode} +${Date.now() - start}ms — auth: ${authInfo}`,
        );
      }),
    );
  }
}
