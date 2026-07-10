import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  passwordHash?: string;

  @Prop()
  name: string;

  @Prop({ required: false, index: true })
  tenantId?: string;

  @Prop({ required: false })
  refreshTokenHash?: string;

  @Prop({ type: [String], index: true, default: [] })
  apiKeys?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
