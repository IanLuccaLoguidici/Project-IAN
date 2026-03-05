import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { CreateTodoCommand } from './create-todo.command';

@CommandHandler(CreateTodoCommand)
export class CreateTodoHandler implements ICommandHandler<CreateTodoCommand, Todo> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
  ) {}

  async execute(command: CreateTodoCommand): Promise<Todo> {
    const { title, done } = command;
    return this.todoRepository.create({ title, done });
  }
}

