import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { TodoMongo, TodoSchema } from './infrastructure/todo.schema';
import { OpenAIService } from './openai/openai.service';
import { OpenAIController } from './openai/openai.controller';
import { MongooseTodoRepository } from './infrastructure/mongoose-todo.repository';
import { CreateTodoHandler } from './application/commands/create-todo.handler';
import { UpdateTodoHandler } from './application/commands/update-todo.handler';
import { DeleteTodoHandler } from './application/commands/delete-todo.handler';
import { GetAllTodosHandler } from './application/queries/get-all-todos.handler';
import { GetTodoByIdHandler } from './application/queries/get-todo-by-id.handler';
import { RestoreTodoHandler } from './application/commands/restore-todo.handler';
import { PurgeTodoHandler } from './application/commands/purge-todo.handler';
import { UploadTodoAttachmentHandler } from './application/commands/upload-todo-attachment.handler';
import { TodosController } from './todos.controller';
import { RedisService } from '../common/redis/redis.service';
import { TodoProcessor } from './application/processors/todo.processor';

const CQRS_HANDLERS = [
  CreateTodoHandler,
  UpdateTodoHandler,
  DeleteTodoHandler,
  GetAllTodosHandler,
  GetTodoByIdHandler,
  RestoreTodoHandler,
  PurgeTodoHandler,
  UploadTodoAttachmentHandler,
];

@Module({
  imports: [
    CqrsModule,
    BullModule.registerQueue({
      name: 'todo-queue',
    }),
    MongooseModule.forFeature([
      { name: TodoMongo.name, schema: TodoSchema },
    ]),
  ],
  controllers: [TodosController, OpenAIController],
  providers: [
    {
      provide: 'ITodoRepository',
      useClass: MongooseTodoRepository,
    },
    ...CQRS_HANDLERS,
    TodoProcessor,
    OpenAIService,
    RedisService,
  ],
  exports: ['ITodoRepository', RedisService],
})
export class TodosModule {}

