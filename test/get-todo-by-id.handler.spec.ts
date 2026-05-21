import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetTodoByIdHandler } from '../src/todos/application/queries/get-todo-by-id.handler';
import { GetTodoByIdQuery } from '../src/todos/application/queries/get-todo-by-id.query';
import type { ITodoRepository } from '../src/todos/domain/todo-repository.interface';
import { Todo } from '../src/todos/domain/todo.entity';
import { RedisService } from '../src/common/redis/redis.service';
import { MetricsService } from '../src/metrics/metrics.service';

describe('GetTodoByIdHandler', () => {
  let handler: GetTodoByIdHandler;
  let todoRepository: jest.Mocked<ITodoRepository>;

  beforeEach(async () => {
    const repoMock: jest.Mocked<ITodoRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      purge: jest.fn(),
    };

    const redisServiceMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const metricsServiceMock = {
      incrementHit: jest.fn(),
      incrementMiss: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTodoByIdHandler,
        {
          provide: 'ITodoRepository',
          useValue: repoMock,
        },
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
        {
          provide: MetricsService,
          useValue: metricsServiceMock,
        },
      ],
    }).compile();

    handler = module.get(GetTodoByIdHandler);
    todoRepository = module.get('ITodoRepository');
  });


  it('should return a todo when repository finds it', async () => {
    const id = 'todo-id-1';
    const query = new GetTodoByIdQuery(id, 'user-1');

    const todo: Todo = {
      id,
      userId: 'user-1',
      title: 'Existing todo',
      done: false,
      createdAt: new Date('2026-03-05T00:00:00.000Z'),
    };

    todoRepository.findById.mockResolvedValue(todo);

    const result = await handler.execute(query);

    expect(todoRepository.findById).toHaveBeenCalledTimes(1);
    expect(todoRepository.findById).toHaveBeenCalledWith(id, 'user-1');
    expect(result).toEqual(todo);
  });

  it('should throw NotFoundException when repository returns null', async () => {
    const id = 'missing-id';
    const query = new GetTodoByIdQuery(id, 'user-1');

    todoRepository.findById.mockResolvedValue(null);

    await expect(handler.execute(query)).rejects.toBeInstanceOf(NotFoundException);
    await expect(handler.execute(query)).rejects.toThrow(
      `Todo with id "${id}" not found`,
    );

    expect(todoRepository.findById).toHaveBeenCalledWith(id, 'user-1');
  });
});

