import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { RedisService } from '../common/redis/redis.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const mockRedisService = {
      zadd: jest.fn(),
      zrevrangeWithScores: jest.fn(),
      expire: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    redisService = module.get(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addScore', () => {
    it('should call zadd with the correct arguments', async () => {
      await service.addScore('lbKey', 'player1', 100);
      expect(redisService.zadd).toHaveBeenCalledWith('lbKey', 100, 'player1');
      expect(redisService.expire).not.toHaveBeenCalled();
    });

    it('should set TTL if provided', async () => {
      await service.addScore('lbKey', 'player1', 100, 3600);
      expect(redisService.zadd).toHaveBeenCalledWith('lbKey', 100, 'player1');
      expect(redisService.expire).toHaveBeenCalledWith('lbKey', 3600);
    });
  });

  describe('getTopPlayers', () => {
    it('should call zrevrangeWithScores and map results', async () => {
      redisService.zrevrangeWithScores.mockResolvedValue([
        ['player1', 200],
        ['player2', 150],
      ]);

      const result = await service.getTopPlayers('lbKey', 5);

      expect(redisService.zrevrangeWithScores).toHaveBeenCalledWith('lbKey', 0, 4);
      expect(result).toEqual([
        { member: 'player1', score: 200 },
        { member: 'player2', score: 150 },
      ]);
    });

    it('should use default limit of 10 if not provided', async () => {
      redisService.zrevrangeWithScores.mockResolvedValue([]);

      await service.getTopPlayers('lbKey');

      expect(redisService.zrevrangeWithScores).toHaveBeenCalledWith('lbKey', 0, 9);
    });
  });
});
