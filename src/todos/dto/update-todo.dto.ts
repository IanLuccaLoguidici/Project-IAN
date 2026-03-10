import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTodoDto {
  @ApiProperty({
    description: 'Updated description of the todo item',
    example: 'Buy milk and bread',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Updated completion status',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  done?: boolean;
}

