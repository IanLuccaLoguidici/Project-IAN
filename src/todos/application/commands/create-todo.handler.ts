import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { CreateTodoCommand } from './create-todo.command';
import { RedisService } from '../../../common/redis/redis.service';

@CommandHandler(CreateTodoCommand)
export class CreateTodoHandler implements ICommandHandler<CreateTodoCommand, Todo> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(command: CreateTodoCommand): Promise<Todo> {
    const { title, done } = command;
    const todo = await this.todoRepository.create({ title, done });
    await this.redisService.del('todos:all');
    return todo;
  }
}

