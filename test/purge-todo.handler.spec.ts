import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PurgeTodoHandler } from '../src/todos/application/commands/purge-todo.handler';
import { PurgeTodoCommand } from '../src/todos/application/commands/purge-todo.command';
import type { ITodoRepository } from '../src/todos/domain/todo-repository.interface';
import { RedisService } from '../src/common/redis/redis.service';

describe('PurgeTodoHandler', () => {
  let handler: PurgeTodoHandler;
  let todoRepository: jest.Mocked<ITodoRepository>;
  let redisService: jest.Mocked<RedisService>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurgeTodoHandler,
        { provide: 'ITodoRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    handler = module.get(PurgeTodoHandler);
    todoRepository = module.get('ITodoRepository');
    redisService = module.get(RedisService) as any;
  });

  it('should purge and invalidate cache', async () => {
    todoRepository.purge.mockResolvedValue(true);
    
    await handler.execute(new PurgeTodoCommand('todo-1', 'user-1'));

    expect(todoRepository.purge).toHaveBeenCalledWith('todo-1', 'user-1');
    expect(redisService.delPattern).toHaveBeenCalledWith('todos:all:*');
    expect(redisService.del).toHaveBeenCalledWith('todos:todo-1');
  });

  it('should throw NotFoundException if repository purge returns false', async () => {
    todoRepository.purge.mockResolvedValue(false);
    
    await expect(handler.execute(new PurgeTodoCommand('todo-missing', 'user-1'))).rejects.toThrow(NotFoundException);
    expect(todoRepository.purge).toHaveBeenCalledWith('todo-missing', 'user-1');
    expect(redisService.delPattern).not.toHaveBeenCalled();
    expect(redisService.del).not.toHaveBeenCalled();
  });
});
