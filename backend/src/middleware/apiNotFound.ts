import type { Request, Response } from "express";
import { respondError } from "../shared/response.js";

/**
 * 404 handler for unmounted API routes
 * 
 * This middleware MUST be mounted AFTER all /api/* routes
 * but BEFORE express.static() to ensure /api/* returns JSON.
 * 
 * Routes returning 404 via handler (not middleware) are caught by enhancedErrorHandler.
 * This catches requests for completely unmounted paths like /api/unknown.
 */

export function apiNotFoundHandler(req: Request, res: Response) {
  return respondError(
    res,
    "API_ROUTE_NOT_FOUND",
    "API route not found",
    404,
    {
      method: req.method,
      path: req.path,
      availableRoutes: "/api/docs",
    }
  );
}
