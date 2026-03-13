import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { UpdateTodoCommand } from './update-todo.command';
import { RedisService } from '../../../common/redis/redis.service';

@CommandHandler(UpdateTodoCommand)
export class UpdateTodoHandler implements ICommandHandler<UpdateTodoCommand, Todo> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: UpdateTodoCommand): Promise<Todo> {
    const { id, title, done } = command;
    const updated = await this.todoRepository.update(id, { title, done });

    if (!updated) {
      throw new NotFoundException(`Todo with id "${id}" not found`);
    }

    await this.redisService.del('todos:all');
    await this.redisService.del(`todos:${id}`);

    return updated;
  }
}

