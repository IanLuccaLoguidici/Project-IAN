export class PurgeTodoCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
  ) {}
}
