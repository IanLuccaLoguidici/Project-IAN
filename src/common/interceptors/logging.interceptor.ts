import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'winston';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request & { requestId?: string }>();
    const res = httpCtx.getResponse<Response>();

    const { method, originalUrl } = req;
    const requestId = req.requestId ?? 'N/A';
    const startAt = Date.now();

    this.logger.info('Incoming request', {
      method,
      path: originalUrl,
      requestId,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startAt;
          this.logger.info('Request completed', {
            method,
            path: originalUrl,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            requestId,
          });
        },
        error: (err: { status?: number }) => {
          const duration = Date.now() - startAt;
          this.logger.error('Request failed', {
            method,
            path: originalUrl,
            statusCode: err?.status ?? 500,
            duration: `${duration}ms`,
            requestId,
            error: err,
          });
        },
      }),
    );
  }
}
