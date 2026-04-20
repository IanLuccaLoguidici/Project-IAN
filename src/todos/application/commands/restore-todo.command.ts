export class RestoreTodoCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
