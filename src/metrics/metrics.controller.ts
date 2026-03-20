import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Get cache hit/miss statistics' })
  getMetrics() {
    return this.metricsService.getMetrics();
  }
}
