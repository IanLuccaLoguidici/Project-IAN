export interface Todo {
  id: string;
  userId: string;
  title: string;
  done: boolean;
  attachmentPath?: string;
  createdAt: Date;
  deletedAt?: Date | null;
  tenantId?: string;
}

