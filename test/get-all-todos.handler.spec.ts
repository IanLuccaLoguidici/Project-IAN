import { Test, TestingModule } from '@nestjs/testing';
import { GetAllTodosHandler } from '../src/todos/application/queries/get-all-todos.handler';
import { GetAllTodosQuery } from '../src/todos/application/queries/get-all-todos.query';
import type { ITodoRepository } from '../src/todos/domain/todo-repository.interface';
import { RedisService } from '../src/common/redis/redis.service';
import { MetricsService } from '../src/metrics/metrics.service';

describe('GetAllTodosHandler', () => {
  let handler: GetAllTodosHandler;
  let todoRepository: jest.Mocked<ITodoRepository>;
  let redisService: jest.Mocked<RedisService>;
  let metricsService: jest.Mocked<MetricsService>;

  beforeEach(async () => {
    const mockRepo: jest.Mocked<ITodoRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      purge: jest.fn(),
    };

    const mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    };

    const mockMetrics = {
      incrementHit: jest.fn(),
      incrementMiss: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllTodosHandler,
        { provide: 'ITodoRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
        { provide: MetricsService, useValue: mockMetrics },
      ],
    }).compile();

    handler = module.get(GetAllTodosHandler);
    todoRepository = module.get('ITodoRepository');
    redisService = module.get(RedisService) as any;
    metricsService = module.get(MetricsService) as any;
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should return cached data if available', async () => {
    const query = new GetAllTodosQuery('user-1', 1, 10);
    const cachedResponse = { data: [{ title: 'Cached' }], meta: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false } };
    
    redisService.get.mockResolvedValue(cachedResponse);

    const result = await handler.execute(query);

    expect(redisService.get).toHaveBeenCalledWith('todos:all:user-1:page:1:limit:10');
    expect(metricsService.incrementHit).toHaveBeenCalled();
    expect(metricsService.incrementMiss).not.toHaveBeenCalled();
    expect(todoRepository.findAll).not.toHaveBeenCalled();
    expect(result).toEqual(cachedResponse);
  });

  it('should query the database if no cache is available', async () => {
    const query = new GetAllTodosQuery('user-1', 2, 5, 'search', true, 'filter-id');
    const dbResponse = { data: [{ id: '1', title: 'DB Todo', done: true, userId: 'filter-id', createdAt: new Date() }], total: 1 };
    
    redisService.get.mockResolvedValue(null);
    todoRepository.findAll.mockResolvedValue(dbResponse);

    const result = await handler.execute(query);

    expect(metricsService.incrementMiss).toHaveBeenCalled();
    const expectedCacheKey = 'todos:all:user-1:page:2:limit:5:search:search:done:true:filterUserId:filter-id';
    expect(redisService.get).toHaveBeenCalledWith(expectedCacheKey);
    // skip = (2 - 1) * 5 = 5
    expect(todoRepository.findAll).toHaveBeenCalledWith(5, 5, 'user-1', 'search', true, 'filter-id');
    
    expect(result.data).toEqual(dbResponse.data);
    expect(result.meta).toEqual({ page: 2, limit: 5, total: 1, totalPages: 1, hasMore: false });
    
    expect(redisService.set).toHaveBeenCalledWith(expectedCacheKey, result);
  });
});
