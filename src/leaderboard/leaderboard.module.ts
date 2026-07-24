import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { RedisService } from '../common/redis/redis.service';

@Module({
  controllers: [LeaderboardController],
  providers: [LeaderboardService, RedisService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
