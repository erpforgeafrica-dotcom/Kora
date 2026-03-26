import type { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { logger } from "../shared/logger.js";

// Rate limiters by endpoint type
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per window
  message: "Too many auth attempts, please try again later",
  skipSuccessfulRequests: true,
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // High limit for webhooks
  message: "Webhook rate limit exceeded",
});

// API Key validation
const validApiKeys = new Set(
  (process.env.VALID_API_KEYS || "").split(",").filter(Boolean)
);

export function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    logger.warn("Missing API key", { path: req.path, ip: req.ip });
    return res.status(401).json({
      error: "unauthorized",
      message: "API key required",
    });
  }

  if (!validApiKeys.has(apiKey)) {
    logger.warn("Invalid API key", { path: req.path, ip: req.ip });
    return res.status(403).json({
      error: "forbidden",
      message: "Invalid API key",
    });
  }

  (req as typeof req & { apiKey?: string }).apiKey = apiKey;
  next();
}

// Rate limit by user/org
export function createOrgRateLimiter(requestsPerMinute = 60) {
  return rateLimit({
    windowMs: 60 * 1000,
    max: requestsPerMinute,
    keyGenerator: (req, res) => {
      const orgId = (res?.locals?.auth?.organizationId) || "anonymous";  // ✅ Use JWT org, not header
      const userId = (req as any).user?.id;
      return `${orgId}:${userId}`;
    },
    message: "Organization rate limit exceeded",
  });
}
