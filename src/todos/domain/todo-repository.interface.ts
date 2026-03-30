import { Todo } from './todo.entity';

export interface ITodoRepository {
  findAll(skip: number, limit: number, userId: string): Promise<{ data: Todo[]; total: number }>;
  findById(id: string, userId: string): Promise<Todo | null>;
  create(data: { title: string; done?: boolean; userId: string }): Promise<Todo>;
  update(
    id: string,
    userId: string,
    data: Partial<Pick<Todo, 'title' | 'done' | 'attachmentPath'>>
  ): Promise<Todo | null>;
  delete(id: string, userId: string): Promise<boolean>;
}

