type CacheValue = {
  value: string;
  expiresAt: number;
};

type RedisClient = {
  status: string;
  connect: () => Promise<void>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode: "EX", ttlSeconds: number) => Promise<unknown>;
  del: (key: string) => Promise<number>;
};

const fallbackCache = new Map<string, CacheValue>();
const redisUrl = process.env.REDIS_URL;

let redis: RedisClient | null = null;
let redisAttempted = false;

async function getRedis() {
  if (!redisUrl) return null;
  if (!redis && !redisAttempted) {
    redisAttempted = true;
    try {
      const redisModule = await import("ioredis");
      const RedisCtor = redisModule.default as unknown as {
        new (
          url: string,
          options: { lazyConnect: boolean; maxRetriesPerRequest: number; enableReadyCheck: boolean }
        ): RedisClient;
      };
      redis = new RedisCtor(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false
      });
    } catch {
      redis = null;
    }
  }

  if (!redis) return null;
  if (redis.status === "wait") {
    try {
      await redis.connect();
    } catch {
      return null;
    }
  }
  return redis;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const client = await getRedis();
  if (client) {
    try {
      const value = await client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      return null;
    }
  }

  const item = fallbackCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    fallbackCache.delete(key);
    return null;
  }
  return JSON.parse(item.value) as T;
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number) {
  const serialized = JSON.stringify(value);
  const client = await getRedis();
  if (client) {
    try {
      await client.set(key, serialized, "EX", ttlSeconds);
      return;
    } catch {
      // fall through to memory cache
    }
  }

  fallbackCache.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

export async function deleteCachedKey(key: string) {
  const client = await getRedis();
  if (client) {
    try {
      await client.del(key);
    } catch {
      // fall through to local cleanup
    }
  }

  fallbackCache.delete(key);
}

export async function deleteCachedPrefix(prefix: string) {
  const client = await getRedis();
  if (client) {
    try {
      const redisWithScan = client as RedisClient & {
        scan: (cursor: string, match: "MATCH", pattern: string, count: "COUNT", size: number) => Promise<[string, string[]]>;
      };
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redisWithScan.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          for (const key of keys) {
            await client.del(key);
          }
        }
      } while (cursor !== "0");
    } catch {
      // fall through to memory cache
    }
  }

  for (const key of fallbackCache.keys()) {
    if (key.startsWith(prefix)) {
      fallbackCache.delete(key);
    }
  }
}
