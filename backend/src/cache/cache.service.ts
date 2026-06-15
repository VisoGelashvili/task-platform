import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis(this.config.get<string>('REDIS_URL'));
    this.client.on('error', (err) => this.logger.warn(`Redis error: ${err.message}`));
    this.logger.log('CacheService connected to Redis');
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // Returns the parsed value or null if key doesn't exist / Redis is unavailable
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null; // treat cache miss the same as unavailability
    }
  }

  // Stores any JSON-serializable value with an optional TTL (default 60 s)
  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    try {
      // EX sets expiry in seconds — key auto-deletes after ttlSeconds
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Never let a cache write failure crash the request
    }
  }

  // Removes one or more keys atomically
  async del(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
      await this.client.del(keys);
    } catch {
      // Best-effort invalidation
    }
  }
}
