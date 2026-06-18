import { InputType, Field, ID } from '@nestjs/graphql';
import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateTodoInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  done?: boolean;
}
