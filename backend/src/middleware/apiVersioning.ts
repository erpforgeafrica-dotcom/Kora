import type { Request, Response, NextFunction, Router } from "express";
import { logger } from "../shared/logger.js";

export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  deprecatedAt?: Date;
  sunsetAt?: Date;
  description?: string;
}

// Supported API versions
export const API_VERSIONS: Record<string, ApiVersion> = {
  "v1": {
    version: "v1",
    description: "Initial release - organization_id scoped modules",
  },
  "v2": {
    version: "v2",
    description: "Enhanced validation, rate limiting, error handling",
  },
  "v3": {
    version: "v3",
    deprecated: true,
    deprecatedAt: new Date("2025-01-01"),
    sunsetAt: new Date("2025-06-01"),
    description: "Deprecated - use v2 instead",
  },
};

const DEFAULT_VERSION = "v2";

// Extract version from request
export function extractApiVersion(req: Request, res: Response, next: NextFunction) {
  // Priority: header > query param > default
  const version =
    (req.headers["api-version"] as string) ||
    (req.query.api_version as string) ||
    DEFAULT_VERSION;

  if (!API_VERSIONS[version]) {
    return res.status(400).json({
      error: "invalid_api_version",
      message: `API version ${version} not supported`,
      supportedVersions: Object.keys(API_VERSIONS),
    });
  }

  const versionInfo = API_VERSIONS[version];

  // Warn about deprecated versions
  if (versionInfo.deprecated) {
    res.set("Deprecation", "true");
    res.set("Sunset", versionInfo.sunsetAt?.toUTCString() || "");
    logger.warn("Deprecated API version used", {
      version,
      ip: req.ip,
      path: req.path,
      sunsetAt: versionInfo.sunsetAt,
    });
  }

  (req as typeof req & { apiVersion?: string }).apiVersion = version;
  res.set("API-Version", version);
  next();
}

// Version-specific response wrapper
export function versionedResponse(req: Request, data: unknown, statusCode = 200) {
  const version = (req as typeof req & { apiVersion?: string }).apiVersion || DEFAULT_VERSION;

  return {
    apiVersion: version,
    timestamp: new Date().toISOString(),
    data,
    ...(statusCode >= 400 && { statusCode }),
  };
}

// Router factory for versioned endpoints
export function createVersionedRouter(version: string) {
  return {
    version,
    routes: [] as Array<{
      method: string;
      path: string;
      handler: string;
    }>,
    addRoute(method: string, path: string, handler: string) {
      this.routes.push({ method, path, handler });
      return this;
    },
  };
}

// API documentation endpoint
export function getApiDocumentation() {
  return {
    title: "KORA API",
    description: "AI-powered business platform API",
    versions: Object.entries(API_VERSIONS).map(([key, info]) => {
      const { version: _ignored, ...rest } = info;
      return { version: key, ...rest };
    }),
    baseUrl: process.env.API_BASE_URL || "http://localhost:3000/api",
    authentication: {
      type: "Bearer Token (Clerk)",
      header: "Authorization: Bearer <token>",
      optional: ["GET /health", "GET /api/docs"],
    },
    rateLimit: {
      default: "100 requests per 15 minutes",
      auth: "5 attempts per 15 minutes",
      webhook: "1000 requests per minute",
    },
    modules: [
      {
        name: "Clinical",
        path: "/api/clinical",
        version: "v2",
        endpoints: [
          "GET /patients",
          "POST /patients",
          "PATCH /patients/:id",
          "GET /appointments",
          "POST /appointments",
          "PATCH /appointments/:id/status",
        ],
      },
      {
        name: "Emergency",
        path: "/api/emergency",
        version: "v2",
        endpoints: [
          "GET /requests",
          "POST /requests",
          "PATCH /requests/:id/status",
          "GET /units",
          "POST /units",
        ],
      },
      {
        name: "Finance",
        path: "/api/finance",
        version: "v2",
        endpoints: [
          "GET /kpis",
          "GET /invoices",
          "POST /invoices",
          "PATCH /invoices/:id/status",
          "GET /payouts",
        ],
      },
      {
        name: "AI",
        path: "/api/ai",
        version: "v2",
        endpoints: [
          "GET /status",
          "POST /orchestrate/live",
          "POST /orchestrate/feedback",
          "GET /anomalies",
        ],
      },
      {
        name: "Notifications",
        path: "/api/notifications",
        version: "v2",
        endpoints: [
          "GET /channels",
          "POST /dispatch",
          "POST /send",
          "GET /templates",
        ],
      },
      {
        name: "Reporting",
        path: "/api/reporting",
        version: "v2",
        endpoints: [
          "GET /summary",
          "POST /generate",
          "GET /history",
        ],
      },
      {
        name: "Analytics",
        path: "/api/analytics",
        version: "v2",
        endpoints: [
          "GET /business-summary",
          "GET /staff-performance/:id",
          "POST /churn-prediction",
        ],
      },
      {
        name: "Video",
        path: "/api/video",
        version: "v2",
        endpoints: [
          "POST /sessions",
          "GET /sessions/:id",
          "POST /recordings",
          "GET /analytics/:sessionId",
        ],
      },
    ],
  };
}
