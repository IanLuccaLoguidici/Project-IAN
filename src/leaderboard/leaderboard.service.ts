import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Agrega o actualiza el puntaje de un miembro en una tabla de posiciones.
   * Opcionalmente define un tiempo de vida (TTL) en segundos para la tabla entera.
   */
  async addScore(
    leaderboardKey: string,
    member: string,
    score: number,
    ttl?: number,
  ): Promise<void> {
    this.logger.log(`Adding member ${member} with score ${score} to leaderboard ${leaderboardKey}`);
    await this.redisService.zadd(leaderboardKey, score, member);

    if (ttl && ttl > 0) {
      this.logger.log(`Setting TTL of ${ttl}s on leaderboard ${leaderboardKey}`);
      await this.redisService.expire(leaderboardKey, ttl);
    }
  }

  /**
   * Obtiene los mejores jugadores de la tabla de posiciones (ordenados de mayor a menor).
   * Por defecto obtiene los primeros 10.
   */
  async getTopPlayers(
    leaderboardKey: string,
    limit: number = 10,
  ): Promise<{ member: string; score: number }[]> {
    this.logger.log(`Retrieving top ${limit} players from leaderboard ${leaderboardKey}`);
    // ZREVRANGE usa índices basados en 0, por lo que los mejores n elementos van de 0 a n-1
    const stop = limit - 1;
    const pairs = await this.redisService.zrevrangeWithScores(leaderboardKey, 0, stop);
    
    return pairs.map(([member, score]) => ({
      member,
      score,
    }));
  }
}
