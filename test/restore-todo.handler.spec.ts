import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RestoreTodoHandler } from '../src/todos/application/commands/restore-todo.handler';
import { RestoreTodoCommand } from '../src/todos/application/commands/restore-todo.command';
import type { ITodoRepository } from '../src/todos/domain/todo-repository.interface';
import { RedisService } from '../src/common/redis/redis.service';

describe('RestoreTodoHandler', () => {
  let handler: RestoreTodoHandler;
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
        RestoreTodoHandler,
        { provide: 'ITodoRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    handler = module.get(RestoreTodoHandler);
    todoRepository = module.get('ITodoRepository');
    redisService = module.get(RedisService) as any;
  });

  it('should restore and invalidate cache', async () => {
    todoRepository.restore.mockResolvedValue(true);
    
    await handler.execute(new RestoreTodoCommand('todo-1', 'user-1'));

    expect(todoRepository.restore).toHaveBeenCalledWith('todo-1', 'user-1');
    expect(redisService.delPattern).toHaveBeenCalledWith('todos:all:*');
    expect(redisService.del).toHaveBeenCalledWith('todos:todo-1');
  });

  it('should throw NotFoundException if repository restore returns false', async () => {
    todoRepository.restore.mockResolvedValue(false);
    
    await expect(handler.execute(new RestoreTodoCommand('todo-missing', 'user-1'))).rejects.toThrow(NotFoundException);
    expect(todoRepository.restore).toHaveBeenCalledWith('todo-missing', 'user-1');
    expect(redisService.delPattern).not.toHaveBeenCalled();
    expect(redisService.del).not.toHaveBeenCalled();
  });
});
