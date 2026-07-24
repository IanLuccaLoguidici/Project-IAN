import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const method = req.method;
    const route = req.route?.path || req.originalUrl || 'unknown';
    const startAt = process.hrtime();

    return next.handle().pipe(
      tap({
        next: () => {
          const diff = process.hrtime(startAt);
          const durationSeconds = diff[0] + diff[1] / 1e9;
          const statusCode = res.statusCode || 200;

          this.metricsService.recordRequest(method, route, statusCode, durationSeconds);
        },
        error: (err: { status?: number; statusCode?: number }) => {
          const diff = process.hrtime(startAt);
          const durationSeconds = diff[0] + diff[1] / 1e9;
          const statusCode = err?.status || err?.statusCode || 500;

          this.metricsService.recordRequest(method, route, statusCode, durationSeconds);
        },
      }),
    );
  }
}
