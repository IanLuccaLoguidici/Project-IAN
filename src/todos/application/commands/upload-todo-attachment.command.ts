export class UploadTodoAttachmentCommand {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly file: Express.Multer.File,
  ) {}
}
