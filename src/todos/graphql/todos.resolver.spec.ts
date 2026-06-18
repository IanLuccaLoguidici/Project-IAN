import { Test, TestingModule } from '@nestjs/testing';
import { TodosResolver } from './todos.resolver';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { GetAllTodosQuery } from '../application/queries/get-all-todos.query';
import { GetTodoByIdQuery } from '../application/queries/get-todo-by-id.query';
import { CreateTodoCommand } from '../application/commands/create-todo.command';
import { UpdateTodoCommand } from '../application/commands/update-todo.command';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';

describe('TodosResolver', () => {
  let resolver: TodosResolver;
  let queryBus: QueryBus;
  let commandBus: CommandBus;

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockCommandBus = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosResolver,
        { provide: QueryBus, useValue: mockQueryBus },
        { provide: CommandBus, useValue: mockCommandBus },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => true,
      })
      .compile();

    resolver = module.get<TodosResolver>(TodosResolver);
    queryBus = module.get<QueryBus>(QueryBus);
    commandBus = module.get<CommandBus>(CommandBus);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getTodos', () => {
    it('should execute GetAllTodosQuery', async () => {
      const mockTodos = [{ id: '1', title: 'Test', done: false }];
      mockQueryBus.execute.mockResolvedValue(mockTodos);

      const mockContext = { req: { user: { userId: 'userId' } } };
      const result = await resolver.getTodos(mockContext);
      
      expect(result).toEqual(mockTodos);
      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetAllTodosQuery('userId', 1, 100),
      );
    });
  });

  describe('getTodoById', () => {
    it('should execute GetTodoByIdQuery', async () => {
      const mockTodo = { id: '1', title: 'Test', done: false };
      mockQueryBus.execute.mockResolvedValue(mockTodo);

      const mockContext = { req: { user: { userId: 'userId' } } };
      const result = await resolver.getTodoById('1', mockContext);

      expect(result).toEqual(mockTodo);
      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetTodoByIdQuery('1', 'userId'),
      );
    });
  });

  describe('createTodo', () => {
    it('should execute CreateTodoCommand', async () => {
      const mockTodo = { id: '1', title: 'New Todo', done: false };
      mockCommandBus.execute.mockResolvedValue(mockTodo);

      const mockContext = { req: { user: { userId: 'userId' } } };
      const input = { title: 'New Todo', done: false };

      const result = await resolver.createTodo(input, mockContext);

      expect(result).toEqual(mockTodo);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateTodoCommand('userId', 'New Todo', false),
      );
    });
  });

  describe('updateTodo', () => {
    it('should execute UpdateTodoCommand', async () => {
      const mockTodo = { id: '1', title: 'Updated', done: true };
      mockCommandBus.execute.mockResolvedValue(mockTodo);

      const mockContext = { req: { user: { userId: 'userId' } } };
      const input = { id: '1', title: 'Updated', done: true };

      const result = await resolver.updateTodo(input, mockContext);

      expect(result).toEqual(mockTodo);
      expect(commandBus.execute).toHaveBeenCalledWith(
        new UpdateTodoCommand('1', 'userId', 'Updated', true),
      );
    });
  });
});
