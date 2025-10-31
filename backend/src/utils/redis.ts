import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

let client: RedisClientType | null = null;

export function getRedisClient(): RedisClientType {
  if (client) return client;

  client = createClient({ url: config.redis.url });

  client.on('error', (err) => {
    logger.error('Redis Client Error', { error: err instanceof Error ? err.message : err });
  });

  // Connect lazily; fire and forget
  client.connect().catch((err) => {
    logger.error('Failed to connect to Redis', { error: err instanceof Error ? err.message : err });
  });

  logger.info('Redis client initialized', { url: config.redis.url });
  return client;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  // Globally disable cache reads: always behave as a miss
  logger.debug?.('Cache read bypassed (reads disabled)', { key });
  return null;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = config.redis.ttlSeconds): Promise<void> {
  try {
    const redis = getRedisClient();
    const serialized = typeof value === 'string' ? (value as unknown as string) : JSON.stringify(value);
    await redis.set(key, serialized, { EX: ttlSeconds });
  } catch (error) {
    logger.warn('Redis SET failed, bypassing cache', { key, error });
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (error) {
    logger.warn('Redis DEL failed', { key, error });
  }
}

export const cacheKeys = {
  balance: (accountId: string) => `cache:hedera:balance:${accountId}`,
  txHistory: (accountId: string) => `cache:hedera:tx:${accountId}`,
  metrics: {
    dailyRevenue: (accountId: string, dateISO: string) => `cache:metrics:dailyRevenue:${accountId}:${dateISO}`,
    summary: (accountId: string) => `cache:metrics:summary:${accountId}`,
    timeseries: (accountId: string, range: string) => `cache:metrics:timeseries:${accountId}:${range}`
  }
};


