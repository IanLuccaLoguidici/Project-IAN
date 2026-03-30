import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiConsumes, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Todos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiCreatedResponse({ type: TodoResponseDto, description: 'The created todo' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() dto: CreateTodoDto): Promise<Todo> {
    this.logger.info('Creating new todo', { title: dto.title, userId: req.user.userId });
    const command = new CreateTodoCommand(req.user.userId, dto.title, dto.done);
    return this.commandBus.execute(command);
  }


  @Get()
  @ApiOperation({ summary: 'Get all todos' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({ description: 'Paginated list of all todos' })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const actualLimit = limit > 100 ? 100 : limit;
    return this.queryBus.execute(new GetAllTodosQuery(req.user.userId, page, actualLimit));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a todo by id' })
  @ApiOkResponse({ type: TodoResponseDto, description: 'The requested todo' })
  @HttpCode(HttpStatus.OK)
  async findOne(@Req() req: any, @Param('id') id: string): Promise<Todo> {
    return this.queryBus.execute(new GetTodoByIdQuery(id, req.user.userId));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo by id' })
  @ApiOkResponse({ type: TodoResponseDto, description: 'The updated todo' })
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTodoDto,
  ): Promise<Todo> {
    const command = new UpdateTodoCommand(id, req.user.userId, dto.title, dto.done);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a todo by id' })
  @ApiOkResponse({ description: 'Todo deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: any, @Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new DeleteTodoCommand(id, req.user.userId));
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
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFile(new FileValidationPipe())
    file: Express.Multer.File,
  ): Promise<Todo> {
    const command = new UploadTodoAttachmentCommand(id, req.user.userId, file.path);
    return this.commandBus.execute(command);
  }
}

