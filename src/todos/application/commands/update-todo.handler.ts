import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { UpdateTodoCommand } from './update-todo.command';

@CommandHandler(UpdateTodoCommand)
export class UpdateTodoHandler implements ICommandHandler<UpdateTodoCommand, Todo> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
  ) {}

  async execute(command: UpdateTodoCommand): Promise<Todo> {
    const { id, title, done } = command;
    const updated = await this.todoRepository.update(id, { title, done });

    if (!updated) {
      throw new NotFoundException(`Todo with id "${id}" not found`);
    }

    return updated;
  }
}

