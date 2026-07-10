import { Inject, NotFoundException } from '@nestjs/common';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { GetTodoByIdQuery } from './get-todo-by-id.query';
import { RedisService } from '../../../common/redis/redis.service';
import { MetricsService } from '../../../metrics/metrics.service';

@QueryHandler(GetTodoByIdQuery)
export class GetTodoByIdHandler implements IQueryHandler<GetTodoByIdQuery, Todo> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService,
  ) {}

  async execute(query: GetTodoByIdQuery): Promise<Todo> {
    const tracer = trace.getTracer('todos-module');
    return await tracer.startActiveSpan('GetTodoByIdHandler.execute', async (span) => {
      try {
        const { id, userId, tenantId } = query;
        span.setAttribute('todo.id', id);
        span.setAttribute('todo.userId', userId);
        if (tenantId) span.setAttribute('todo.tenantId', tenantId);
        
        const tenantKey = tenantId ? `:${tenantId}` : '';
        const cacheKey = `todos:${userId}:${id}${tenantKey}`;
        const cachedTodo = await this.redisService.get<Todo>(cacheKey);

        if (cachedTodo) {
          this.metricsService.incrementHit();
          span.setAttribute('cache.hit', true);
          span.end();
          return cachedTodo;
        }

        this.metricsService.incrementMiss();
        span.setAttribute('cache.hit', false);
        const todo = await this.todoRepository.findById(id, userId, tenantId);

        if (!todo) {
          throw new NotFoundException(`Todo with id "${id}" not found`);
        }

        await this.redisService.set(cacheKey, todo);
        span.end();
        return todo;
      } catch (err) {
        span.recordException(err as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.end();
        throw err;
      }
    });
  }
}

