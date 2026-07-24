import { Test, TestingModule } from '@nestjs/testing';
import { RedisHealthIndicator } from './redis.health';
import { RedisService } from '../common/redis/redis.service';
import { HealthCheckError } from '@nestjs/terminus';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let redisServiceMock: { ping: jest.Mock };

  beforeEach(async () => {
    redisServiceMock = {
      ping: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
      ],
    }).compile();

    indicator = module.get<RedisHealthIndicator>(RedisHealthIndicator);
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  it('should return healthy status when Redis ping returns PONG', async () => {
    redisServiceMock.ping.mockResolvedValue('PONG');

    const result = await indicator.isHealthy('redis');

    expect(result).toEqual({
      redis: {
        status: 'up',
        message: 'up',
      },
    });
    expect(redisServiceMock.ping).toHaveBeenCalled();
  });

  it('should throw HealthCheckError when Redis ping returns non-PONG value', async () => {
    redisServiceMock.ping.mockResolvedValue('FAIL');

    await expect(indicator.isHealthy('redis')).rejects.toThrow(HealthCheckError);
  });

  it('should throw HealthCheckError when Redis ping rejects with an error', async () => {
    redisServiceMock.ping.mockRejectedValue(new Error('Connection refused'));

    await expect(indicator.isHealthy('redis')).rejects.toThrow(HealthCheckError);
  });
});
