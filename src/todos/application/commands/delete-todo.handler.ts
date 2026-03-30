import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { DeleteTodoCommand } from './delete-todo.command';
import { RedisService } from '../../../common/redis/redis.service';

@CommandHandler(DeleteTodoCommand)
export class DeleteTodoHandler implements ICommandHandler<DeleteTodoCommand, void> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: DeleteTodoCommand): Promise<void> {
    const { id, userId } = command;
    const deleted = await this.todoRepository.delete(id, userId);

    if (!deleted) {
      throw new NotFoundException(`Todo with id "${id}" not found`);
    }

    await this.redisService.delPattern('todos:all:*');
    await this.redisService.del(`todos:${id}`);
  }
}

