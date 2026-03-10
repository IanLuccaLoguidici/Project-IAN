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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { CreateTodoCommand } from './application/commands/create-todo.command';
import { UpdateTodoCommand } from './application/commands/update-todo.command';
import { DeleteTodoCommand } from './application/commands/delete-todo.command';
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
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTodoDto): Promise<Todo> {
    const command = new CreateTodoCommand(dto.title, dto.done);
    return this.commandBus.execute(command);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todos' })
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<Todo[]> {
    return this.queryBus.execute(new GetAllTodosQuery());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a todo by id' })
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<Todo> {
    return this.queryBus.execute(new GetTodoByIdQuery(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo by id' })
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
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.commandBus.execute(new DeleteTodoCommand(id));
    return { message: 'Todo deleted successfully' };
  }
}

