import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class SessionService {
  private readonly ttlSeconds = 24 * 60 * 60; // 24h default TTL

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /** Crea una sesión y devuelve el sessionId */
  async create(userId: string, ttl?: number): Promise<string> {
    const sessionId = crypto.randomUUID();
    const data = JSON.stringify({ userId });
    const expires = ttl ?? this.ttlSeconds;
    await this.redis.setex(`session:${sessionId}`, expires, data);
    return sessionId;
  }

  /** Obtiene la sesión */
  async get(sessionId: string): Promise<{ userId: string } | null> {
    const raw = await this.redis.get(`session:${sessionId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { userId: string };
    } catch {
      return null;
    }
  }

  /** Destruye la sesión */
  async destroy(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}
