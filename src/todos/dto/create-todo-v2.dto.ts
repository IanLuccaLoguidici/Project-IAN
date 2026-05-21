import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateTodoDto } from './create-todo.dto';

export enum TodoPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateTodoV2Dto extends CreateTodoDto {
  @ApiProperty({
    description: 'The priority of the todo item',
    enum: TodoPriority,
    example: TodoPriority.MEDIUM,
    required: true,
  })
  @IsEnum(TodoPriority)
  @IsNotEmpty()
  priority!: TodoPriority;
}
