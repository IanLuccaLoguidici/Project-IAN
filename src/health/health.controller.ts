import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongooseIndicator: MongooseHealthIndicator,
    private redisIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application health (MongoDB and Redis)' })
  check() {
    return this.health.check([
      () => this.mongooseIndicator.pingCheck('mongodb'),
      () => this.redisIndicator.isHealthy('redis'),
    ]);
  }
}
