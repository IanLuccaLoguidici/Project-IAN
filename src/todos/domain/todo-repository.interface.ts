import { Todo } from './todo.entity';

export interface ITodoRepository {
  findAll(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  create(data: { title: string; done?: boolean }): Promise<Todo>;
  update(
    id: string,
    data: Partial<Pick<Todo, 'title' | 'done' | 'attachmentPath'>>
  ): Promise<Todo | null>;
  delete(id: string): Promise<boolean>;
}

