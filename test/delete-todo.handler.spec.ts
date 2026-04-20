import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteTodoHandler } from '../src/todos/application/commands/delete-todo.handler';
import { DeleteTodoCommand } from '../src/todos/application/commands/delete-todo.command';
import type { ITodoRepository } from '../src/todos/domain/todo-repository.interface';
import { RedisService } from '../src/common/redis/redis.service';

describe('DeleteTodoHandler', () => {
  let handler: DeleteTodoHandler;
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
        DeleteTodoHandler,
        { provide: 'ITodoRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    handler = module.get(DeleteTodoHandler);
    todoRepository = module.get('ITodoRepository');
    redisService = module.get(RedisService) as any;
  });

  it('should soft delete and invalidate cache', async () => {
    todoRepository.delete.mockResolvedValue(true);
    
    await handler.execute(new DeleteTodoCommand('todo-1', 'user-1'));

    expect(todoRepository.delete).toHaveBeenCalledWith('todo-1', 'user-1');
    expect(redisService.delPattern).toHaveBeenCalledWith('todos:all:*');
    expect(redisService.del).toHaveBeenCalledWith('todos:todo-1');
  });

  it('should throw NotFoundException if repository delete returns false', async () => {
    todoRepository.delete.mockResolvedValue(false);
    
    await expect(handler.execute(new DeleteTodoCommand('todo-missing', 'user-1'))).rejects.toThrow(NotFoundException);
    expect(todoRepository.delete).toHaveBeenCalledWith('todo-missing', 'user-1');
    expect(redisService.delPattern).not.toHaveBeenCalled();
    expect(redisService.del).not.toHaveBeenCalled();
  });
});
