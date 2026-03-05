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

  @Prop({ required: true, default: false })
  done: boolean;

  createdAt: Date;
}

export const TodoSchema = SchemaFactory.createForClass(TodoMongo);

