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
    const { id, attachmentPath } = command;

    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    const updatedTodo = await this.todoRepository.update(id, {
      attachmentPath,
    });
    
    if (!updatedTodo) {
      throw new NotFoundException(`Todo with ID ${id} could not be updated`);
    }

    return updatedTodo;
  }
}
