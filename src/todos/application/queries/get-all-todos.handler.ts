import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { GetAllTodosQuery } from './get-all-todos.query';
import { RedisService } from '../../../common/redis/redis.service';
import { MetricsService } from '../../../metrics/metrics.service';

@QueryHandler(GetAllTodosQuery)
export class GetAllTodosHandler implements IQueryHandler<GetAllTodosQuery, any> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService,
  ) {}

  async execute(query: GetAllTodosQuery): Promise<any> {
    const { userId, page, limit } = query;
    const cacheKey = `todos:all:${userId}:page:${page}:limit:${limit}`;
    const cachedData = await this.redisService.get<any>(cacheKey);

    if (cachedData) {
      this.metricsService.incrementHit();
      return cachedData;
    }

    this.metricsService.incrementMiss();
    const skip = (page - 1) * limit;
    const { data: todos, total } = await this.todoRepository.findAll(skip, limit, userId);

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    const response = {
      data: todos,
      meta: { page, limit, total, totalPages, hasMore },
    };

    await this.redisService.set(cacheKey, response);
    return response;
  }
}

