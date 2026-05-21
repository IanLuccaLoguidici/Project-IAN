import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ConflictException,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as crypto from 'crypto';
import { RedisService } from '../redis/redis.service';

interface IdempotencyCache {
  bodyHash: string;
  response: any;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'] || request.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      return next.handle();
    }

    const cacheKey = `idempotency:${idempotencyKey}`;
    // Calculamos un hash del body para comparar si la petición es idéntica
    const bodyHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(request.body || {}))
      .digest('hex');
    
    // Comprobar si ya existe una respuesta para esta clave
    const cachedData = await this.redisService.get<IdempotencyCache>(cacheKey);
    
    if (cachedData) {
      // Si el hash del cuerpo no coincide con el almacenado, devolvemos 409 Conflict
      if (cachedData.bodyHash !== bodyHash) {
        throw new ConflictException(
          'El Idempotency-Key proporcionado ya fue utilizado con un cuerpo de solicitud diferente (payload mismatch).',
        );
      }
      // Si coincide, devolvemos la respuesta guardada de forma idempotente
      return of(cachedData.response);
    }

    // Si no existe, continuamos con la ejecución y guardamos la respuesta junto al hash del body
    return next.handle().pipe(
      tap(async (response) => {
        const cachePayload: IdempotencyCache = {
          bodyHash,
          response,
        };
        // Guardar en Redis por 24 horas (86400 segundos)
        await this.redisService.set(cacheKey, cachePayload, 86400);
      }),
    );
  }
}
