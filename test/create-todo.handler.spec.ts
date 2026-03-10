import { Test, TestingModule } from '@nestjs/testing';
import { CreateTodoHandler } from '../src/todos/application/commands/create-todo.handler';
import { CreateTodoCommand } from '../src/todos/application/commands/create-todo.command';
import type { ITodoRepository } from '../src/todos/domain/todo-repository.interface';
import { Todo } from '../src/todos/domain/todo.entity';

describe('CreateTodoHandler', () => {
  let handler: CreateTodoHandler;
  let todoRepository: jest.Mocked<ITodoRepository>;

  beforeEach(async () => {
    const repoMock: jest.Mocked<ITodoRepository> = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTodoHandler,
        {
          provide: 'ITodoRepository',
          useValue: repoMock,
        },
      ],
    }).compile();

    handler = module.get(CreateTodoHandler);
    todoRepository = module.get('ITodoRepository');
  });

  it('should call repository.create with correct payload and return the created todo', async () => {
    const command = new CreateTodoCommand('My todo title', false);

    const createdTodo: Todo = {
      id: 'abc123',
      title: 'My todo title',
      done: false,
      createdAt: new Date('2026-03-05T00:00:00.000Z'),
    };

    todoRepository.create.mockResolvedValue(createdTodo);

    const result = await handler.execute(command);

    expect(todoRepository.create).toHaveBeenCalledTimes(1);
    expect(todoRepository.create).toHaveBeenCalledWith({
      title: 'My todo title',
      done: false,
    });
    expect(result).toEqual(createdTodo);
  });

  it('should allow done to be omitted', async () => {
    const command = new CreateTodoCommand('Without done');
    const createdTodo: Todo = {
      id: 'xyz789',
      title: 'Without done',
      done: false,
      createdAt: new Date('2026-03-05T00:00:00.000Z'),
    };

    todoRepository.create.mockResolvedValue(createdTodo);

    const result = await handler.execute(command);

    expect(todoRepository.create).toHaveBeenCalledWith({
      title: 'Without done',
      done: undefined,
    });
    expect(result).toEqual(createdTodo);
  });
});

