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
      userId: doc.userId,
      title: doc.title,
      done: doc.done,
      attachmentPath: doc.attachmentPath,
      createdAt: doc.createdAt,
    };
  }

  async findAll(skip: number = 0, limit: number = 10, userId: string): Promise<{ data: Todo[]; total: number }> {
    const [docs, total] = await Promise.all([
      this.todoModel.find({ userId }).skip(skip).limit(limit).exec(),
      this.todoModel.countDocuments({ userId }).exec(),
    ]);
    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async findById(id: string, userId: string): Promise<Todo | null> {
    const doc = await this.todoModel.findOne({ _id: id, userId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async create(data: { title: string; done?: boolean; userId: string }): Promise<Todo> {
    const doc = await this.todoModel.create({
      title: data.title,
      done: data.done ?? false,
      userId: data.userId,
    });
    return this.toDomain(doc);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Pick<Todo, 'title' | 'done' | 'attachmentPath'>>,
  ): Promise<Todo | null> {
    const doc = await this.todoModel
      .findOneAndUpdate(
        { _id: id, userId },
        { $set: data },
        { new: true },
      )
      .exec();

    return doc ? this.toDomain(doc) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.todoModel.findOneAndDelete({ _id: id, userId }).exec();
    return !!result;
  }
}

