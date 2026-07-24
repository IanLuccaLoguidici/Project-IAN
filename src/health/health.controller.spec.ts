import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckServiceMock: { check: jest.Mock };
  let mongooseIndicatorMock: { pingCheck: jest.Mock };
  let redisIndicatorMock: { isHealthy: jest.Mock };

  beforeEach(async () => {
    healthCheckServiceMock = {
      check: jest.fn().mockImplementation((checks) => Promise.all(checks.map((fn) => fn()))),
    };
    mongooseIndicatorMock = {
      pingCheck: jest.fn().mockResolvedValue({ mongodb: { status: 'up' } }),
    };
    redisIndicatorMock = {
      isHealthy: jest.fn().mockResolvedValue({ redis: { status: 'up' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheckServiceMock },
        { provide: MongooseHealthIndicator, useValue: mongooseIndicatorMock },
        { provide: RedisHealthIndicator, useValue: redisIndicatorMock },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should perform health check on mongodb and redis', async () => {
    const result = await controller.check();

    expect(mongooseIndicatorMock.pingCheck).toHaveBeenCalledWith('mongodb');
    expect(redisIndicatorMock.isHealthy).toHaveBeenCalledWith('redis');
    expect(result).toEqual([
      { mongodb: { status: 'up' } },
      { redis: { status: 'up' } },
    ]);
  });
});
