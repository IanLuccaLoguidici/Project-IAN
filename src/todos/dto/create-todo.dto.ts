import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTodoDto {
  @ApiProperty({
    description: 'Short description of the todo item',
    example: 'Buy milk',
  })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    description: 'Whether the todo is already completed',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  done?: boolean;
}

