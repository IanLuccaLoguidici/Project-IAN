import { Global, Module } from '@nestjs/common';
import { FeatureFlagService } from './feature-flags.service';
import { RedisService } from '../common/redis/redis.service';

@Global()
@Module({
  providers: [FeatureFlagService, RedisService],
  exports: [FeatureFlagService],
})
export class FeatureFlagsModule {}
