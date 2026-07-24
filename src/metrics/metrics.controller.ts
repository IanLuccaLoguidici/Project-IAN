import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Get Prometheus format application metrics' })
  async getMetrics(@Res() res: Response) {
    const metrics = await this.metricsService.getPrometheusMetrics();
    res.setHeader('Content-Type', this.metricsService.getPrometheusContentType());
    res.send(metrics);
  }

  @Get('cache')
  @ApiOperation({ summary: 'Get legacy cache hit/miss statistics' })
  getCacheMetrics() {
    return this.metricsService.getMetrics();
  }
}
