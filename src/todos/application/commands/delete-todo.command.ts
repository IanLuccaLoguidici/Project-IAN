import { ICommand } from '@nestjs/cqrs';

export class DeleteTodoCommand implements ICommand {
  constructor(public readonly id: string) {}
}

