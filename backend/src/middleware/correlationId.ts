import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { createRequestLogger } from "../shared/logger.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      logger: ReturnType<typeof createRequestLogger>;
    }
  }
}

/**
 * Middleware to inject correlation ID and request-scoped logger
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate or extract correlation ID
  const requestId = (req.headers['x-request-id'] as string) || 
                   (req.headers['x-correlation-id'] as string) || 
                   randomUUID();

  // Attach to request
  req.requestId = requestId;
  
  // Set response header for client tracking
  res.setHeader('X-Request-ID', requestId);
  
  // Create request-scoped logger
  const userId = (req as any).user?.id;
  const organizationId = res.locals?.auth?.organizationId;
  req.logger = createRequestLogger(requestId, userId, organizationId);
  
  // Log request start
  req.logger.info('Request started', {
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    query: Object.keys(req.query).length > 0 ? req.query : undefined
  });
  
  // Track response time
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    req.logger[level]('Request completed', {
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length')
    });
  });
  
  next();
}