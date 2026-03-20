import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { GetAllTodosQuery } from './get-all-todos.query';
import { RedisService } from '../../../common/redis/redis.service';
import { MetricsService } from '../../../metrics/metrics.service';

@QueryHandler(GetAllTodosQuery)
export class GetAllTodosHandler implements IQueryHandler<GetAllTodosQuery, Todo[]> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService,
  ) {}

  async execute(): Promise<Todo[]> {
    const cacheKey = 'todos:all';
    const cachedTodos = await this.redisService.get<Todo[]>(cacheKey);

    if (cachedTodos) {
      this.metricsService.incrementHit();
      return cachedTodos;
    }

    this.metricsService.incrementMiss();
    const todos = await this.todoRepository.findAll();
    await this.redisService.set(cacheKey, todos);
    return todos;
  }
}

