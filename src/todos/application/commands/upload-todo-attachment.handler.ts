import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UploadTodoAttachmentCommand } from './upload-todo-attachment.command';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';

@CommandHandler(UploadTodoAttachmentCommand)
export class UploadTodoAttachmentHandler
  implements ICommandHandler<UploadTodoAttachmentCommand>
{
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
  ) {}

  async execute(command: UploadTodoAttachmentCommand): Promise<Todo> {
    const { id, userId, attachmentPath } = command;

    const todo = await this.todoRepository.findById(id, userId);
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    const updatedTodo = await this.todoRepository.update(id, userId, {
      attachmentPath,
    });
    
    if (!updatedTodo) {
      throw new NotFoundException(`Todo with ID ${id} could not be updated`);
    }

    return updatedTodo;
  }
}
