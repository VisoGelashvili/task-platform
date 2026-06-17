import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis(this.config.get<string>("REDIS_URL"));
    this.client.on("error", (err) =>
      this.logger.warn(`Redis error: ${err.message}`),
    );
    this.logger.log("CacheService connected to Redis");
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {}
  }

  async del(...keys: string[]): Promise<void> {
    if (!keys.length) return;
    try {
      await this.client.del(keys);
    } catch {}
  }
}
