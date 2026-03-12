import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiConsumes, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoResponseDto } from './dto/todo-response.dto';
import { CreateTodoCommand } from './application/commands/create-todo.command';
import { UpdateTodoCommand } from './application/commands/update-todo.command';
import { DeleteTodoCommand } from './application/commands/delete-todo.command';
import { UploadTodoAttachmentCommand } from './application/commands/upload-todo-attachment.command';
import { GetAllTodosQuery } from './application/queries/get-all-todos.query';
import { GetTodoByIdQuery } from './application/queries/get-todo-by-id.query';
import type { Todo } from './domain/todo.entity';

@ApiTags('Todos')
@Controller('todos')
export class TodosController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiCreatedResponse({ type: TodoResponseDto, description: 'The created todo' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTodoDto): Promise<Todo> {
    const command = new CreateTodoCommand(dto.title, dto.done);
    return this.commandBus.execute(command);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todos' })
  @ApiOkResponse({ type: [TodoResponseDto], description: 'List of all todos' })
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Todo[]> {
    return this.queryBus.execute(new GetAllTodosQuery());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a todo by id' })
  @ApiOkResponse({ type: TodoResponseDto, description: 'The requested todo' })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Todo> {
    return this.queryBus.execute(new GetTodoByIdQuery(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo by id' })
  @ApiOkResponse({ type: TodoResponseDto, description: 'The updated todo' })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ): Promise<Todo> {
    const command = new UpdateTodoCommand(id, dto.title, dto.done);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a todo by id' })
  @ApiOkResponse({ description: 'Todo deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new DeleteTodoCommand(id));
    return { message: 'Todo deleted successfully' };
  }

  @Post(':id/attachment')
  @ApiOperation({ summary: 'Upload an attachment for a todo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({
    type: TodoResponseDto,
    description: 'The updated todo with attachment',
  })
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/todos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile(new FileValidationPipe())
    file: Express.Multer.File,
  ): Promise<Todo> {
    const command = new UploadTodoAttachmentCommand(id, file.path);
    return this.commandBus.execute(command);
  }
}

