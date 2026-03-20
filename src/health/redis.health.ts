import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.redisService.ping();
      const isHealthy = result === 'PONG';
      const status = this.getStatus(key, isHealthy, { message: isHealthy ? 'up' : 'down' });

      if (isHealthy) {
        return status;
      }
      throw new HealthCheckError('Redischeck failed', status);
    } catch (e) {
      throw new HealthCheckError('Redischeck failed', this.getStatus(key, false, { message: e.message }));
    }
  }
}
