import { Controller, Post, Get, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

export class AddScoreDto {
  leaderboardKey: string;
  member: string;
  score: number;
  ttl?: number;
}

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Post()
  async addScore(@Body() dto: AddScoreDto): Promise<void> {
    await this.leaderboardService.addScore(
      dto.leaderboardKey,
      dto.member,
      dto.score,
      dto.ttl,
    );
  }

  @Get(':key')
  async getTop(
    @Param('key') key: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{ member: string; score: number }[]> {
    return this.leaderboardService.getTopPlayers(key, limit);
  }
}
