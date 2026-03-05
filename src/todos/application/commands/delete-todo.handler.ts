import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { DeleteTodoCommand } from './delete-todo.command';

@CommandHandler(DeleteTodoCommand)
export class DeleteTodoHandler implements ICommandHandler<DeleteTodoCommand, void> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
  ) {}

  async execute(command: DeleteTodoCommand): Promise<void> {
    const { id } = command;
    const deleted = await this.todoRepository.delete(id);

    if (!deleted) {
      throw new NotFoundException(`Todo with id "${id}" not found`);
    }
  }
}

