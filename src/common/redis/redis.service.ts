import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.client = new Redis(redisUrl);

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    if (!data) {
      this.logger.log(`Cache miss for key: ${key}`);
      return null;
    }
    this.logger.log(`Cache hit for key: ${key}`);
    return JSON.parse(data) as T;
  }

  async set(key: string, value: any, ttlInSeconds: number = 3600): Promise<void> {
    this.logger.log(`Setting cache for key: ${key} with TTL ${ttlInSeconds}s`);
    await this.client.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
  }

  async del(key: string): Promise<void> {
    this.logger.log(`Invalidating cache for key: ${key}`);
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    this.logger.log('Clearing all cache');
    await this.client.flushall();
  }
}
