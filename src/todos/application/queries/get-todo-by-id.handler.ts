import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { GetTodoByIdQuery } from './get-todo-by-id.query';

@QueryHandler(GetTodoByIdQuery)
export class GetTodoByIdHandler implements IQueryHandler<GetTodoByIdQuery, Todo> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
  ) {}

  async execute(query: GetTodoByIdQuery): Promise<Todo> {
    const { id } = query;
    const todo = await this.todoRepository.findById(id);

    if (!todo) {
      throw new NotFoundException(`Todo with id "${id}" not found`);
    }

    return todo;
  }
}

