import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { getRedisConnectionToken } from '@nestjs-modules/ioredis';

describe('SessionService', () => {
  let service: SessionService;
  let redisMock: {
    setex: jest.Mock;
    get: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    redisMock = {
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRedisConnectionToken(),
          useValue: redisMock,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a session with default TTL in Redis and return a sessionId', async () => {
      redisMock.setex.mockResolvedValue('OK');

      const userId = 'user-123';
      const sessionId = await service.create(userId);

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(redisMock.setex).toHaveBeenCalledWith(
        `session:${sessionId}`,
        86400,
        JSON.stringify({ userId }),
      );
    });

    it('should support custom TTL when provided', async () => {
      redisMock.setex.mockResolvedValue('OK');

      const userId = 'user-123';
      const customTtl = 3600;
      const sessionId = await service.create(userId, customTtl);

      expect(redisMock.setex).toHaveBeenCalledWith(
        `session:${sessionId}`,
        customTtl,
        JSON.stringify({ userId }),
      );
    });
  });

  describe('get', () => {
    it('should return session data if found in Redis', async () => {
      const sessionId = 'valid-session-id';
      redisMock.get.mockResolvedValue(JSON.stringify({ userId: 'user-123' }));

      const session = await service.get(sessionId);

      expect(session).toEqual({ userId: 'user-123' });
      expect(redisMock.get).toHaveBeenCalledWith(`session:${sessionId}`);
    });

    it('should return null if session is not found in Redis', async () => {
      redisMock.get.mockResolvedValue(null);

      const session = await service.get('non-existent');

      expect(session).toBeNull();
    });

    it('should return null if session data is corrupted JSON', async () => {
      redisMock.get.mockResolvedValue('invalid-json');

      const session = await service.get('corrupted-session');

      expect(session).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should delete session from Redis', async () => {
      redisMock.del.mockResolvedValue(1);

      const sessionId = 'session-to-delete';
      await service.destroy(sessionId);

      expect(redisMock.del).toHaveBeenCalledWith(`session:${sessionId}`);
    });
  });
});
