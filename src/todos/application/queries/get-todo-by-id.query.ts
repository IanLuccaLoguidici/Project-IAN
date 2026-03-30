import { IQuery } from '@nestjs/cqrs';

export class GetTodoByIdQuery implements IQuery {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}

