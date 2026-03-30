import { ICommand } from '@nestjs/cqrs';

export class CreateTodoCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly done?: boolean,
  ) {}
}

