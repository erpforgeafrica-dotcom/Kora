import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ValidationError } from "./enhancedErrorHandler.js";

/**
 * Middleware to validate request body against a Zod schema
 * @param schema - Zod schema to validate against
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      (req as typeof req & { parsedBody?: T }).parsedBody = validated;
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          errors[path] = issue.message;
        });
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            context: { errors }
          }
        });
      }
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid request body"
        }
      });
    }
  };
}

/**
 * Middleware to validate query parameters against a Zod schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      return next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const path = issue.path.join(".");
          errors[path] = issue.message;
        });
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            context: { errors }
          }
        });
      }
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid query parameters"
        }
      });
    }
  };
}
