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
  Version,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { memoryStorage } from 'multer';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiConsumes, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CreateTodoDto } from './dto/create-todo.dto';
import { CreateTodoV2Dto } from './dto/create-todo-v2.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoResponseDto } from './dto/todo-response.dto';
import { CreateTodoCommand } from './application/commands/create-todo.command';
import { UpdateTodoCommand } from './application/commands/update-todo.command';
import { DeleteTodoCommand } from './application/commands/delete-todo.command';
import { RestoreTodoCommand } from './application/commands/restore-todo.command';
import { PurgeTodoCommand } from './application/commands/purge-todo.command';
import { UploadTodoAttachmentCommand } from './application/commands/upload-todo-attachment.command';
import { GetAllTodosQuery } from './application/queries/get-all-todos.query';
import { GetTodoByIdQuery } from './application/queries/get-todo-by-id.query';
import type { Todo } from './domain/todo.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IdempotencyInterceptor } from '../common/interceptors/idempotency.interceptor';
import { FeatureFlagService } from '../feature-flags/feature-flags.service';

@ApiTags('Todos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({
  path: 'todos',
  version: '1',
})
export class TodosController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly featureFlagService: FeatureFlagService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ 
    summary: 'Create a new todo',
    deprecated: true,
    description: 'Use the V2 version of this endpoint which includes the mandatory priority field.'
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Clave única para garantizar que la solicitud sea idempotente (evita la creación duplicada)',
    required: false,
  })
  @ApiCreatedResponse({ type: TodoResponseDto, description: 'The created todo' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() dto: CreateTodoDto): Promise<Todo> {
    this.logger.info('Creating new todo (V1)', { title: dto.title, userId: req.user.userId });
    const command = new CreateTodoCommand(req.user.userId, dto.title, dto.done);
    return this.commandBus.execute(command);
  }

  @Version('2')
  @Post()
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Create a new todo (V2)' })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Clave única para garantizar que la solicitud sea idempotente (evita la creación duplicada)',
    required: false,
  })
  @ApiCreatedResponse({ type: TodoResponseDto, description: 'The created todo with priority' })
  @HttpCode(HttpStatus.CREATED)
  async createV2(@Req() req: any, @Body() dto: CreateTodoV2Dto): Promise<Todo> {
    this.logger.info('Creating new todo (V2)', { title: dto.title, priority: dto.priority, userId: req.user.userId });
    // Nota: Aquí se debería pasar el priority al comando, pero para este ejemplo solo mostramos el DTO y el controlador.
    const command = new CreateTodoCommand(req.user.userId, dto.title, dto.done);
    return this.commandBus.execute(command);
  }


  @Get()
  @ApiOperation({ 
    summary: 'Get all todos',
    deprecated: true,
    description: 'Use the V2 version of this endpoint.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Comprar' })
  @ApiQuery({ name: 'done', required: false, type: Boolean, description: 'Filter by completion status' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by string userId' })
  @ApiOkResponse({ description: 'Paginated list of all todos' })
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('done') done?: string,
    @Query('userId') filterUserId?: string,
  ) {
    const actualLimit = limit > 100 ? 100 : limit;
    const isDone = done === 'true' ? true : done === 'false' ? false : undefined;

    const isSearchV2Enabled = await this.featureFlagService.isEnabled('enableSearchV2');

    if (isSearchV2Enabled && search) {
      this.logger.info('Executing NEW search logic (V2)', { userId: req.user.userId, search });
      // Aquí podrías despachar un comando/query diferente, ej: new AdvancedSearchQuery(...)
      // A modo de ejemplo, usamos la consulta actual pero añadimos metadatos para demostrar la bifurcación.
      const result = await this.queryBus.execute(
        new GetAllTodosQuery(req.user.userId, page, actualLimit, search, isDone, filterUserId)
      );
      return {
        _metadata: { searchEngine: 'v2-advanced-search', flagEnabled: true },
        data: result,
      };
    }

    this.logger.info('Executing OLD search logic (V1)', { userId: req.user.userId, search });
    return this.queryBus.execute(
      new GetAllTodosQuery(req.user.userId, page, actualLimit, search, isDone, filterUserId)
    );
  }

  @Version('2')
  @Get()
  @ApiOperation({ summary: 'Get all todos (Version 2)' })
  @HttpCode(HttpStatus.OK)
  async findAllV2() {
    const isV2Enabled = await this.featureFlagService.isEnabled('enable-todos-v2');
    
    if (!isV2Enabled) {
      return {
        message: 'La versión 2 de Todos está deshabilitada temporalmente por un feature flag.',
        data: [],
      };
    }

    return {
      message: '¡Esta es la versión 2 (V2) de la ruta todos!',
      data: [],
    };
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
  @ApiOperation({ summary: 'Soft delete a todo by id' })
  @ApiOkResponse({ description: 'Todo soft-deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: any, @Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new DeleteTodoCommand(id, req.user.userId));
    return { message: 'Todo soft-deleted successfully' };
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted todo' })
  @ApiOkResponse({ description: 'Todo restored successfully' })
  @HttpCode(HttpStatus.OK)
  async restore(@Req() req: any, @Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new RestoreTodoCommand(id, req.user.userId));
    return { message: 'Todo restored successfully' };
  }

  @Delete(':id/purge')
  @ApiOperation({ summary: 'Permanently delete a todo (purge)' })
  @ApiOkResponse({ description: 'Todo purged successfully' })
  @HttpCode(HttpStatus.OK)
  async purge(@Req() req: any, @Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new PurgeTodoCommand(id, req.user.userId));
    return { message: 'Todo purged successfully' };
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
      storage: memoryStorage(),
    }),
  )
  async uploadAttachment(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFile(new FileValidationPipe())
    file: Express.Multer.File,
  ): Promise<Todo> {
    const command = new UploadTodoAttachmentCommand(id, req.user.userId, file);
    return this.commandBus.execute(command);
  }
}

