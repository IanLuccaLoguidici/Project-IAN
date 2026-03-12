import { ApiProperty } from '@nestjs/swagger';

export class TodoResponseDto {
  @ApiProperty({ description: 'The unique identifier of the todo', example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ description: 'Short description of the todo item', example: 'Buy milk' })
  title!: string;

  @ApiProperty({ description: 'Whether the todo is completed', example: false })
  done!: boolean;

  @ApiProperty({ description: 'The file path of the attached file, if any', example: 'uploads/todos/file-123.jpg', required: false })
  attachmentPath?: string;

  @ApiProperty({ description: 'The creation timestamp', example: '2026-03-05T00:00:00.000Z' })
  createdAt!: Date;
}
