import type { NextFunction, Request, Response } from "express";

/**
 * API Response Contract Middleware
 *
 * PURPOSE: Safety net for any legacy route that does not yet use
 * respondSuccess / respondError / respondList from shared/response.ts.
 *
 * FAST PATH: If the response body already has a `success` field (canonical),
 * it is passed through with zero re-processing. This means all current routes
 * that use the canonical helpers incur NO overhead from this middleware.
 *
 * SLOW PATH: Only non-canonical bodies (missing `success` field) are
 * re-wrapped. This handles any legacy route that still calls res.json()
 * directly with a raw object.
 *
 * REMOVAL PLAN: Once all routes are confirmed canonical, this middleware
 * can be removed entirely. Track via: grep -r "res\.json(" src/modules
 */

function normalizeErrorCode(code: unknown, fallback = "INTERNAL_SERVER_ERROR"): string {
  const raw = typeof code === "string" && code.trim().length > 0 ? code : fallback;
  const snake = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
  if (!snake) return fallback.toUpperCase();
  return /^[A-Z]/.test(snake) ? snake : `ERR_${snake}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCanonical(body: unknown): boolean {
  // Fast check: canonical bodies always have a boolean `success` field at root
  return isPlainObject(body) && typeof body.success === "boolean";
}

function wrapLegacyError(body: unknown, statusCode: number): Record<string, unknown> {
  if (isPlainObject(body) && isPlainObject(body.error)) {
    const message = typeof body.error.message === "string"
      ? body.error.message
      : typeof (body as any).message === "string"
        ? (body as any).message
        : "Unexpected error";
    const details = body.error.details ?? (body as any).details ?? (body as any).valid ?? undefined;
    return {
      success: false,
      error: {
        code: normalizeErrorCode(body.error.code ?? body.error.error ?? body.error),
        message,
        ...(details !== undefined ? { details } : {}),
      },
    };
  }

  return {
    success: false,
    error: {
      code: normalizeErrorCode(
        undefined,
        statusCode === 401 ? "UNAUTHORIZED" : statusCode === 403 ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR"
      ),
      message: typeof body === "string" && body.trim().length > 0 ? body : "Unexpected error",
    },
  };
}

function wrapLegacySuccess(body: unknown): Record<string, unknown> {
  // If it's already a plain object without `success`, wrap it
  if (isPlainObject(body)) {
    return { success: true, data: body, meta: null };
  }
  if (Array.isArray(body)) {
    return { success: true, data: body, meta: { page: 1, limit: body.length, total: body.length, total_pages: 1 } };
  }
  return { success: true, data: body, meta: null };
}

export function apiResponseContract(req: Request, res: Response, next: NextFunction) {
  if (!req.originalUrl.startsWith("/api/")) {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = function apiContractJson(body: unknown) {
    // ── FAST PATH ──────────────────────────────────────────────────────────────
    // Body already has `success` field → canonical → pass through with zero work
    if (isCanonical(body)) {
      return originalJson(body);
    }

    // ── SKIP FLAGS ─────────────────────────────────────────────────────────────
    if (res.locals?.skipApiResponseContract === true) {
      return originalJson(body);
    }

    // 204 No Content — body is empty, nothing to wrap
    if (res.statusCode === 204) {
      return originalJson(body);
    }

    // ── SLOW PATH — legacy route, re-wrap ──────────────────────────────────────
    const normalized = res.statusCode >= 400
      ? wrapLegacyError(body, res.statusCode)
      : wrapLegacySuccess(body);

    return originalJson(normalized);
  };

  next();
}
