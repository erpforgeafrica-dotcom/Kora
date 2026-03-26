import type { Request, Response, NextFunction } from "express";
import { Redis } from "ioredis";
import { logger } from "../shared/logger.js";

// Redis client for caching
const redisOptions = process.env.REDIS_URL 
  ? { maxRetriesPerRequest: 3 }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: 1, // Use DB 1 for caching (DB 0 is for BullMQ)
      maxRetriesPerRequest: 3,
    };
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, redisOptions) : new Redis(redisOptions);

redis.on("error", (err: Error) => {
  logger.error("Redis cache error", { 
    url: process.env.REDIS_URL,
    message: err.message,
    name: err.name,
    stack: err.stack,
    full: JSON.stringify(err)
  });
});

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
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug("Cache hit", { key: cacheKey });
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }

      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache response
      res.json = function(data: any) {
        // Cache successful responses only
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setex(cacheKey, ttlSeconds, JSON.stringify(data)).catch((err: Error) => {
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
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info("Cache invalidated", { pattern, count: keys.length });
    }
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
