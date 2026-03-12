import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ITodoRepository } from '../domain/todo-repository.interface';
import { Todo } from '../domain/todo.entity';
import { TodoDocument, TodoMongo } from './todo.schema';

@Injectable()
export class MongooseTodoRepository implements ITodoRepository {
  constructor(
    @InjectModel(TodoMongo.name)
    private readonly todoModel: Model<TodoDocument>,
  ) {}

  private toDomain(doc: TodoDocument): Todo {
    return {
      id: doc._id.toString(),
      title: doc.title,
      done: doc.done,
      attachmentPath: doc.attachmentPath,
      createdAt: doc.createdAt,
    };
  }

  async findAll(): Promise<Todo[]> {
    const docs = await this.todoModel.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findById(id: string): Promise<Todo | null> {
    const doc = await this.todoModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async create(data: { title: string; done?: boolean }): Promise<Todo> {
    const doc = await this.todoModel.create({
      title: data.title,
      done: data.done ?? false,
    });
    return this.toDomain(doc);
  }

  async update(
    id: string,
    data: Partial<Pick<Todo, 'title' | 'done' | 'attachmentPath'>>,
  ): Promise<Todo | null> {
    const doc = await this.todoModel
      .findByIdAndUpdate(
        id,
        { $set: data },
        { new: true },
      )
      .exec();

    return doc ? this.toDomain(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.todoModel.findByIdAndDelete(id).exec();
    return !!result;
  }
}

