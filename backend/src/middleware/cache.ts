import type { Request, Response, NextFunction } from "express";
import { Redis } from "ioredis";
import { logger } from "../shared/logger.js";

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableReadyCheck: false,
      });
      redis.on("error", (err: Error) => {
        logger.warn("Redis cache error", { message: err.message });
      });
    } catch {
      redis = null;
    }
  }
  return redis;
}

/**
 * Cache middleware for GET requests
 */
export function cacheMiddleware(ttlSeconds = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Skip caching for authenticated requests with user-specific data
    if (req.path.includes("/me") || req.path.includes("/profile")) {
      return next();
    }

    const orgId = res.locals?.auth?.organizationId || "public";
    const userRole = res.locals?.auth?.userRole || "guest";
    const cacheKey = `cache:${orgId}:${userRole}:${req.originalUrl}`;

    try {
      const client = getRedis();
      const cached = client ? await client.get(cacheKey) : null;
      if (cached) {
        logger.debug("Cache hit", { key: cacheKey });
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);
      res.json = function(data: any) {
        if (res.statusCode >= 200 && res.statusCode < 300 && client) {
          client.setex(cacheKey, ttlSeconds, JSON.stringify(data)).catch((err: Error) => {
            logger.warn("Failed to cache response", { key: cacheKey, error: err.message });
          });
        }
        res.setHeader("X-Cache", "MISS");
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.warn("Cache middleware error", { error: error instanceof Error ? error.message : "unknown" });
      next();
    }
  };
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string) {
  try {
    const client = getRedis();
    if (!client) return;
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  } catch (error) {
    logger.error("Cache invalidation failed", { pattern, error: error instanceof Error ? error.message : "unknown" });
  }
}

/**
 * Cache invalidation middleware for state-changing requests
 */
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const invalidatePatterns = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const orgId = res.locals?.auth?.organizationId || "public";
        for (const pattern of patterns) {
          await invalidateCache(`cache:${orgId}:*:${pattern}`);
        }
      }
    };

    // Override response methods
    res.json = function(data: any) {
      invalidatePatterns().catch((err) => {
        logger.warn("Cache invalidation failed", { error: err.message });
      });
      return originalJson(data);
    };

    res.send = function(data: any) {
      invalidatePatterns().catch((err) => {
        logger.warn("Cache invalidation failed", { error: err.message });
      });
      return originalSend(data);
    };

    next();
  };
}

export { redis as cacheClient };
