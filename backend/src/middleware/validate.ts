import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { respondError, respondValidationError } from "../shared/response.js";

/**
 * Zod validation middleware — canonical contract compliant.
 * All errors return { success: false, error: { code, message, details } }
 */

function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_root";
    errors[path] = issue.message;
  });
  return errors;
}

/** Validate req.body against a Zod schema. Returns 422 on failure. */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return respondValidationError(res, "Request body validation failed", {
        errors: formatZodErrors(result.error),
      });
    }
    req.body = result.data;
    return next();
  };
}

/** Validate req.query against a Zod schema. Returns 422 on failure. */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return respondValidationError(res, "Query parameter validation failed", {
        errors: formatZodErrors(result.error),
      });
    }
    req.query = result.data as any;
    return next();
  };
}

/** Validate req.params against a Zod schema. Returns 422 on failure. */
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return respondValidationError(res, "Route parameter validation failed", {
        errors: formatZodErrors(result.error),
      });
    }
    req.params = result.data as any;
    return next();
  };
}

/** Shared Zod schemas used across multiple modules */
export const commonSchemas = {
  uuid: z.string().uuid("Must be a valid UUID"),
  email: z.string().email("Must be a valid email address"),
  nonEmptyString: z.string().min(1, "Cannot be empty"),
  positiveInt: z.number().int().positive("Must be a positive integer"),
  pagination: z.object({
    page:  z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  dateString: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  isoDatetime: z.string().datetime({ message: "Must be a valid ISO 8601 datetime" }),
  planId: z.enum(["starter", "growth", "professional", "enterprise"]),
  billingInterval: z.enum(["monthly", "yearly"]),
  currency: z.string().length(3).default("usd"),
};

/** Re-export zod for convenience */
export { z };
