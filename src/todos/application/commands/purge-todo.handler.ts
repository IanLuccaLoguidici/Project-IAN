import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { PurgeTodoCommand } from './purge-todo.command';
import { RedisService } from '../../../common/redis/redis.service';

@CommandHandler(PurgeTodoCommand)
export class PurgeTodoHandler implements ICommandHandler<PurgeTodoCommand, void> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: PurgeTodoCommand): Promise<void> {
    const { id, userId } = command;
    const purged = await this.todoRepository.purge(id, userId);

    if (!purged) {
      throw new NotFoundException(`Todo with id "${id}" not found`);
    }

    await this.redisService.delPattern('todos:all:*');
    await this.redisService.del(`todos:${id}`);
  }
}
