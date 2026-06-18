import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TodoType } from './todo.type';
import { GetAllTodosQuery } from '../application/queries/get-all-todos.query';
import { GetTodoByIdQuery } from '../application/queries/get-todo-by-id.query';
import { CreateTodoCommand } from '../application/commands/create-todo.command';
import { UpdateTodoCommand } from '../application/commands/update-todo.command';
import { CreateTodoInput } from './dto/create-todo.input';
import { UpdateTodoInput } from './dto/update-todo.input';
import { Context } from '@nestjs/graphql';

@UseGuards(JwtAuthGuard)
@Resolver(() => TodoType)
export class TodosResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Query(() => [TodoType], { name: 'todos' })
  async getTodos(@Context() context: any): Promise<TodoType[]> {
    const userId = context.req.user.userId;
    // Assuming page 1, limit 100 as default parameters like in the controller for simplicity or they can be args.
    // For now returning the result of GetAllTodosQuery which handles pagination as well, we pass defaults.
    return this.queryBus.execute(new GetAllTodosQuery(userId, 1, 100));
  }

  @Query(() => TodoType, { name: 'todo' })
  async getTodoById(
    @Args('id') id: string,
    @Context() context: any,
  ): Promise<TodoType> {
    const userId = context.req.user.userId;
    return this.queryBus.execute(new GetTodoByIdQuery(id, userId));
  }

  @Mutation(() => TodoType, { name: 'createTodo' })
  async createTodo(
    @Args('input') input: CreateTodoInput,
    @Context() context: any,
  ): Promise<TodoType> {
    const userId = context.req.user.userId;
    return this.commandBus.execute(
      new CreateTodoCommand(userId, input.title, input.done),
    );
  }

  @Mutation(() => TodoType, { name: 'updateTodo' })
  async updateTodo(
    @Args('input') input: UpdateTodoInput,
    @Context() context: any,
  ): Promise<TodoType> {
    const userId = context.req.user.userId;
    return this.commandBus.execute(
      new UpdateTodoCommand(input.id, userId, input.title, input.done),
    );
  }
}

