import {
  Controller,
  Get,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiHeader,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LogsService } from './logs.service';
import { AdminOrApiKeyGuard } from '../common/guards/admin-or-api-key.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('App Logs')
@Controller('app-logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, AdminOrApiKeyGuard)
  @ApiBearerAuth()
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key para acceso administrativo',
    required: false,
  })
  @ApiOperation({ summary: 'Obtener logs recientes del sistema' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'level', required: false, description: 'Filtrar por nivel (info, error, warn)', example: 'error' })
  @ApiResponse({ status: 200, description: 'Lista de logs paginada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('level') level?: string,
  ) {
    return this.logsService.getLogs(page, limit, level);
  }
}
