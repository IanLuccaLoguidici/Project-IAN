import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { GetAllTodosQuery } from './get-all-todos.query';

@QueryHandler(GetAllTodosQuery)
export class GetAllTodosHandler implements IQueryHandler<GetAllTodosQuery, Todo[]> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
  ) {}

  async execute(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }
}

