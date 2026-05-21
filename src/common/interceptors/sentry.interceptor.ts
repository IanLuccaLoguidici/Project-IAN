import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const requestId = request.headers['x-request-id'] || 'no-id';

    // Añadimos un breadcrumb para la solicitud entrante
    Sentry.addBreadcrumb({
      category: 'http',
      message: `Incoming request: ${method} ${url}`,
      level: 'info',
      data: {
        method,
        url,
        requestId,
      },
    });

    // Usamos el scope actual para añadir metadatos a cualquier error que ocurra en esta petición
    const scope = Sentry.getCurrentScope();
    if (user) {
      scope.setUser({ 
        id: user.userId || user.id,
        username: user.username || user.email 
      });
    }
    scope.setTag('requestId', requestId);
    scope.setExtra('url', url);
    scope.setExtra('method', method);

    return next.handle().pipe(
      tap({
        error: (exception) => {
          // Capturamos la excepción manualmente si no es un error de Nest que ya se capture en otro lugar
          Sentry.captureException(exception);
        },
      }),
    );
  }
}
