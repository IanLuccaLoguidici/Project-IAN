export class UploadTodoAttachmentCommand {
  constructor(
    public readonly id: string,
    public readonly attachmentPath: string,
  ) {}
}
