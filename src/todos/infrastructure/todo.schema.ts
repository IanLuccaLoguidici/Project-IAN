import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TodoDocument = TodoMongo & Document;

@Schema({
  collection: 'todos',
  timestamps: { createdAt: true, updatedAt: false },
})
export class TodoMongo {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, default: false })
  done: boolean;

  @Prop({ required: false })
  attachmentPath?: string;

  createdAt: Date;
}

export const TodoSchema = SchemaFactory.createForClass(TodoMongo);

