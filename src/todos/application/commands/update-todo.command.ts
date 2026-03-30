import { ICommand } from '@nestjs/cqrs';

export class UpdateTodoCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title?: string,
    public readonly done?: boolean,
  ) {}
}

