import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TodoMongo, TodoSchema } from './infrastructure/todo.schema';
import { MongooseTodoRepository } from './infrastructure/mongoose-todo.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TodoMongo.name, schema: TodoSchema },
    ]),
  ],
  providers: [
    {
      provide: 'ITodoRepository',
      useClass: MongooseTodoRepository,
    },
  ],
  exports: ['ITodoRepository'],
})
export class TodosModule {}

