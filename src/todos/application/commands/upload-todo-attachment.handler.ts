import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UploadTodoAttachmentCommand } from './upload-todo-attachment.command';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { MinioService } from '../../../common/minio/minio.service';

@CommandHandler(UploadTodoAttachmentCommand)
export class UploadTodoAttachmentHandler
  implements ICommandHandler<UploadTodoAttachmentCommand>
{
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly minioService: MinioService,
  ) {}

  async execute(command: UploadTodoAttachmentCommand): Promise<Todo> {
    const { id, userId, file } = command;

    const todo = await this.todoRepository.findById(id, userId);
    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    // Subir archivo a MinIO
    const fileUrl = await this.minioService.uploadFile(file);

    const updatedTodo = await this.todoRepository.update(id, userId, {
      attachmentPath: fileUrl,
    });
    
    if (!updatedTodo) {
      throw new NotFoundException(`Todo with ID ${id} could not be updated`);
    }

    return updatedTodo;
  }
}
