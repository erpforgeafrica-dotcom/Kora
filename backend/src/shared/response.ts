import type { Request, Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta: Record<string, unknown> | null;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

function toPositiveInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function normalizeErrorCode(code: unknown, fallback = "INTERNAL_SERVER_ERROR") {
  const raw = typeof code === "string" && code.trim().length > 0 ? code : fallback;
  const snake = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

  if (!snake) {
    return fallback;
  }

  return /^[A-Z]/.test(snake) ? snake : `ERR_${snake}`;
}

export function buildPaginationMeta(
  req: Request,
  options: {
    count?: unknown;
    limit?: unknown;
    page?: unknown;
    offset?: unknown;
    itemCount?: number;
  } = {}
): PaginationMeta {
  const fallbackLimit = Math.max(options.itemCount ?? 0, 1);
  const limit = toPositiveInt(options.limit ?? req.query.limit, fallbackLimit);
  const total = Math.max(0, Number(options.count ?? options.itemCount ?? 0) || 0);
  const pageFromOffset = options.offset !== undefined
    ? Math.floor(Math.max(0, Number(options.offset) || 0) / Math.max(limit, 1)) + 1
    : undefined;
  const page = toPositiveInt(options.page ?? req.query.page ?? pageFromOffset, 1);
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / Math.max(limit, 1))) : 1;

  return {
    page,
    limit,
    total,
    total_pages: totalPages,
  };
}

export function respondSuccess<T>(res: Response, data: T, statusCode = 200, meta: Record<string, unknown> | null = null) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
  } satisfies ApiSuccessResponse<T>);
}

export function respondList<T>(
  req: Request,
  res: Response,
  items: T[],
  options: {
    count?: number;
    limit?: number;
    page?: number;
    offset?: number;
    meta?: Record<string, unknown>;
  } = {},
  statusCode = 200
) {
  const pagination = buildPaginationMeta(req, {
    count: options.count ?? items.length,
    limit: options.limit,
    page: options.page,
    offset: options.offset,
    itemCount: items.length,
  });

  return respondSuccess(
    res,
    items,
    statusCode,
    {
      ...pagination,
      ...(options.meta ?? {}),
    }
  );
}

export function respondError(
  res: Response,
  code: unknown,
  message: string,
  statusCode = 400,
  details?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: normalizeErrorCode(code),
      message,
      ...(details !== undefined ? { details } : {}),
    },
  } satisfies ApiErrorEnvelope);
}

export function respondNotFound(res: Response, message = "Not found", details?: unknown) {
  return respondError(res, "NOT_FOUND", message, 404, details);
}

export function respondUnauthorized(res: Response, message = "Unauthorized", details?: unknown) {
  return respondError(res, "UNAUTHORIZED", message, 401, details);
}

export function respondForbidden(res: Response, message = "Forbidden", details?: unknown) {
  return respondError(res, "FORBIDDEN", message, 403, details);
}

export function respondValidationError(res: Response, message = "Validation failed", details?: unknown) {
  return respondError(res, "VALIDATION_ERROR", message, 422, details);
}
