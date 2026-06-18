import { Field, ObjectType, ID } from '@nestjs/graphql';

@ObjectType('Todo')
export class TodoType {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  title: string;

  @Field()
  done: boolean;

  @Field({ nullable: true })
  attachmentPath?: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  deletedAt?: Date;
}
