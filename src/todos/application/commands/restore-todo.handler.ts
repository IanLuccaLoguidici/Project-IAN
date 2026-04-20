import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { RestoreTodoCommand } from './restore-todo.command';
import { RedisService } from '../../../common/redis/redis.service';

@CommandHandler(RestoreTodoCommand)
export class RestoreTodoHandler implements ICommandHandler<RestoreTodoCommand, void> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: RestoreTodoCommand): Promise<void> {
    const { id, userId } = command;
    const restored = await this.todoRepository.restore(id, userId);

    if (!restored) {
      throw new NotFoundException(`Todo with id "${id}" not found or not deleted`);
    }

    await this.redisService.delPattern('todos:all:*');
    await this.redisService.del(`todos:${id}`);
  }
}
