import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { TodoMongo, TodoSchema } from './infrastructure/todo.schema';
import { MongooseTodoRepository } from './infrastructure/mongoose-todo.repository';
import { CreateTodoHandler } from './application/commands/create-todo.handler';
import { UpdateTodoHandler } from './application/commands/update-todo.handler';
import { DeleteTodoHandler } from './application/commands/delete-todo.handler';
import { GetAllTodosHandler } from './application/queries/get-all-todos.handler';
import { GetTodoByIdHandler } from './application/queries/get-todo-by-id.handler';
import { TodosController } from './todos.controller';

const CQRS_HANDLERS = [
  CreateTodoHandler,
  UpdateTodoHandler,
  DeleteTodoHandler,
  GetAllTodosHandler,
  GetTodoByIdHandler,
];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([
      { name: TodoMongo.name, schema: TodoSchema },
    ]),
  ],
  controllers: [TodosController],
  providers: [
    {
      provide: 'ITodoRepository',
      useClass: MongooseTodoRepository,
    },
    ...CQRS_HANDLERS,
  ],
  exports: ['ITodoRepository'],
})
export class TodosModule {}

