import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { ITodoRepository } from '../../domain/todo-repository.interface';
import { Todo } from '../../domain/todo.entity';
import { GetTodoByIdQuery } from './get-todo-by-id.query';
import { RedisService } from '../../../common/redis/redis.service';

@QueryHandler(GetTodoByIdQuery)
export class GetTodoByIdHandler implements IQueryHandler<GetTodoByIdQuery, Todo> {
  constructor(
    @Inject('ITodoRepository')
    private readonly todoRepository: ITodoRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(query: GetTodoByIdQuery): Promise<Todo> {
    const { id } = query;
    const cacheKey = `todos:${id}`;
    const cachedTodo = await this.redisService.get<Todo>(cacheKey);

    if (cachedTodo) {
      return cachedTodo;
    }

    const todo = await this.todoRepository.findById(id);

    if (!todo) {
      throw new NotFoundException(`Todo with id "${id}" not found`);
    }

    await this.redisService.set(cacheKey, todo);
    return todo;
  }
}

