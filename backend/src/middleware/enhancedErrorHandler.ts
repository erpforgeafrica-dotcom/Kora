import type { Request, Response, NextFunction } from "express";
import { logger } from "../shared/logger.js";
import { respondError } from "../shared/response.js";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  errors?: Record<string, string>;
}



export class ValidationError extends Error implements AppError {
  statusCode = 422;
  code = "VALIDATION_ERROR";
  errors?: Record<string, string>;

  constructor(message = "Invalid request data", errors?: Record<string, string>, code?: string) {
    super(message);
    if (code) this.code = code;
    this.errors = errors;
  }
}

export class BadRequestError extends Error implements AppError {
  statusCode = 400;
  code: string;

  constructor(message = "Bad request", code = "BAD_REQUEST") {
    super(message);
    this.code = code;
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  code: string;

  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message);
    this.code = code;
  }
}

export class UnauthorizedError extends Error implements AppError {
  statusCode = 401;
  code = "UNAUTHORIZED";

  constructor(message = "Unauthorized") {
    super(message);
    this.code = "UNAUTHORIZED";
  }
}

export class ForbiddenError extends Error implements AppError {
  statusCode = 403;
  code = "FORBIDDEN";

  constructor(message = "Forbidden") {
    super(message);
    this.code = "FORBIDDEN";
  }
}

export class AccountLockedError extends Error implements AppError {
  statusCode = 429;
  code = "ACCOUNT_LOCKED";

  constructor(message = "Account temporarily locked") {
    super(message);
    this.code = "ACCOUNT_LOCKED";
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  code = "CONFLICT";

  constructor(message = "Conflict") {
    super(message);
    this.code = "CONFLICT";
  }
}

export class InternalServerError extends Error implements AppError {
  statusCode = 500;
  code = "INTERNAL_SERVER_ERROR";

  constructor(message = "Internal server error") {
    super(message);
    this.code = "INTERNAL_SERVER_ERROR";
  }
}

export function enhancedErrorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const appError = err as AppError;
  const statusCode = appError.statusCode || 500;
  const code = appError.code || "INTERNAL_SERVER_ERROR";

  const errorLog = {
    timestamp: new Date().toISOString(),
    statusCode,
    code,
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req as any).user?.id,
    organizationId: (res.locals?.auth?.organizationId) || "unknown",
    errors: appError.errors,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  };

  if (statusCode >= 500) {
    logger.error("Server error", errorLog);
  } else if (statusCode >= 400) {
    logger.warn("Client error", errorLog);
  } else {
    logger.info("Request error", errorLog);
  }

  return respondError(
    res,
    code,
    err.message || "Unexpected error",
    statusCode,
    appError.errors ? { errors: appError.errors } : undefined
  );

}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
