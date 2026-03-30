import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { CreateTodoCommand } from './create-todo.command';
import { RedisService } from '../../../common/redis/redis.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@CommandHandler(CreateTodoCommand)
export class CreateTodoHandler implements ICommandHandler<CreateTodoCommand, Todo> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly redisService: RedisService,
    @InjectQueue('todo-queue')
    private readonly todoQueue: Queue,
  ) {}

  async execute(command: CreateTodoCommand): Promise<Todo> {
    const { userId, title, done } = command;
    const todo = await this.todoRepository.create({ userId, title, done });
    await this.redisService.delPattern('todos:all:*');
    return todo;
  }
}

