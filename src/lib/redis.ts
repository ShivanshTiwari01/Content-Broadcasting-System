import { Redis } from 'ioredis';
import { env } from '../config/env.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn(
            '[Redis] Max retries reached – caching disabled for this request',
          );
          return null; // stop retrying
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on('connect', () => console.log('[Redis] Connected'));
    redisClient.on('error', (err: Error) =>
      console.warn('[Redis] Error:', err.message),
    );
  }
  return redisClient;
}

export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await getRedisClient().get(key);
  } catch {
    return null; // gracefully degrade if Redis is down
  }
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds = 30,
): Promise<void> {
  try {
    await getRedisClient().set(key, value, 'EX', ttlSeconds);
  } catch {
    // silently ignore
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await getRedisClient().del(key);
  } catch {
    // silently ignore
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
