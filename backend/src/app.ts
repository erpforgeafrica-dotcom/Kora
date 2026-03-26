import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { requestLogger } from "./middleware/requestLogger.js";
import { enhancedErrorHandler } from "./middleware/enhancedErrorHandler.js";
import { apiNotFoundHandler } from "./middleware/apiNotFound.js";
import { apiResponseContract } from "./middleware/apiResponseContract.js";
import { apiLimiter, createOrgRateLimiter } from "./middleware/rateLimiter.js";
import { extractApiVersion } from "./middleware/apiVersioning.js";
import { csrfToken, validateCSRF, getCSRFToken } from "./middleware/csrf.js";
import { cacheMiddleware, invalidateCacheMiddleware } from "./middleware/cache.js";
import { generateOpenAPISpec } from "./middleware/openapi.js";
import { EventTypes, eventEmitterMiddleware } from "./shared/eventBus.js";
import { correlationIdMiddleware } from "./middleware/correlationId.js";
import { checkDatabaseHealth } from "./db/client.js";
import { logger } from "./shared/logger.js";
import { config } from "./config/environment.js";
// NOTE: v1.2 canonical API is organization_id-scoped modules.
// Business_id-based Phase 1B routes remain in-repo for reference but are not mounted.
import { authRoutes } from "./modules/auth/routes.js";
import { clinicalRoutes } from "./modules/clinical/routes.js";
import { emergencyRoutes } from "./modules/emergency/routes.js";
import { financeRoutes } from "./modules/finance/routes.js";
import { aiRoutes } from "./modules/ai/routes.js";
import { notificationsRoutes } from "./modules/notifications/routes.js";
import { reportingRoutes } from "./modules/reporting/routes.js";
import { clientsRoutes as clientsModuleRoutes } from "./modules/clients/routes.js";
import { crmRoutes } from "./modules/crm/routes.js";
import { staffRoutes as staffModuleRoutes } from "./modules/staff/routes.js";
import { tenantRoutes } from "./modules/tenant/routes.js";
import { analyticsRoutes } from "./modules/analytics/routes.js";
import { platformRoutes } from "./modules/platform/routes.js";
import { discoveryRoutes } from "./modules/discovery/routes.js";
import { campaignsRoutes } from "./modules/campaigns/routes.js";
import { paymentsRoutes as paymentsModuleRoutes, paymentsWebhookHandler } from "./modules/payments/routes.js";
import { mediaRoutes } from "./modules/media/routes.js";
import { reviewsRoutes } from "./modules/reviews/routes.js";
import { marketplaceRoutes } from "./modules/marketplace/routes.js";
import { socialRoutes } from "./modules/social/routes.js";
import { socialOAuthRoutes } from "./modules/social/oauthRoutes.js";
import { videoConsultationRoutes } from "./modules/video/consultationRoutes.js";
import { automationRoutes } from "./modules/automation/routes.js";
import { providersRoutes } from "./modules/providers/routes.js";
import { geofenceRoutes } from "./modules/geofence/routes.js";
import { videoRoutes } from "./modules/video/routes.js";
import { canvaRoutes } from "./modules/canva/routes.js";
import { multiPaymentRoutes } from "./modules/payments/multiGateway.js";
import { categoriesRoutes } from "./modules/categories/routes.js";
import { servicesRoutes } from "./modules/services/routes.js";
import { bookingWorkflowRoutes } from "./modules/bookings/workflowRoutes.js";
import { schemaRoutes } from "./modules/schema/routes.js";
import { chatbotRoutes } from "./modules/chatbot/routes.js";
import * as auth from "./middleware/auth.js";
import { resolveOrganizationContext as rbacResolveOrgContext } from "./middleware/organizationContext.js";
import { bookingsRoutes } from "./modules/bookings/routes.js";
import { tenantsRoutes } from "./modules/tenants/routes.js";
import { subscriptionsRoutes } from "./modules/subscriptions/routes.js";
import { inventoryRoutes } from "./modules/inventory/routes.js";
import { deliveryRoutes } from "./modules/delivery/routes.js";
import { billingRoutes } from "./modules/billing/billingRoutes.js";
import { workflowRoutes } from "./workflows/routes.js";
import { contentRoutes, publicContentRoutes } from "./modules/content/routes.js";
import { supportRoutes } from "./modules/support/routes.js";

const requireAuth = auth.requireAuth;
const optionalAuth = auth.optionalAuth;
const resolveOrganizationContext = rbacResolveOrgContext;

export function createApp() {
  const app = express();
  const currentDir = path.dirname(fileURLToPath(import.meta.url));

  // Security headers — production-hardened
  app.use(helmet({
    hsts: config.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      }
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true,
  }));

  // CORS — restrict to configured origins in production
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'X-Org-Id', 'X-Request-ID', 'X-CSRF-Token', 'X-Session-Id'],
  }));

  // Correlation ID — must be first for tracing
  app.use(correlationIdMiddleware);

  // Body parsing with raw body capture for webhooks
  app.use(express.json({
    limit: '1mb',
    verify: (req, _res, buffer) => {
      (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    }
  }));
  app.use(cookieParser());

  // Logging
  app.use(morgan('tiny'));
  app.use(requestLogger);
  app.use(apiResponseContract);

  // API versioning
  app.use(extractApiVersion);

  // Rate limiting
  app.use(apiLimiter);
  app.use(createOrgRateLimiter(60));

  // Auth middleware
  app.use(optionalAuth);

  // CSRF protection
  app.use(csrfToken);
  app.use(validateCSRF);

  const frontendDist = path.resolve(currentDir, "..", "..", "frontend", "dist");

  app.get("/health", async (_req, res) => {
    const dbHealth = await checkDatabaseHealth();
    const status = dbHealth.healthy ? 'ok' : 'degraded';
    const httpStatus = dbHealth.healthy ? 200 : 503;
    res.status(httpStatus).json({
      status,
      service: 'kora-backend',
      version: process.env.npm_package_version || '1.2.0',
      environment: config.NODE_ENV,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealth,
      }
    });
  });

  app.get("/api/docs", (_req, res) => {
    res.json(generateOpenAPISpec());
  });

  app.get("/api/csrf-token", getCSRFToken);

  app.get("/api/health/metrics", requireAuth, async (_req, res) => {
    const dbHealth = await checkDatabaseHealth();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealth.details,
    });
  });

  // *** AUTH ROUTES - MOUNTED BEFORE requireAuth ***
  app.use("/api/auth", authRoutes);

  // Core canonical modules (require auth + caching)
  app.use("/api/clients", requireAuth, cacheMiddleware(300), invalidateCacheMiddleware(["/api/clients*"]), eventEmitterMiddleware(EventTypes.CLIENT_CREATED), clientsModuleRoutes);
  app.use("/api/staff", requireAuth, cacheMiddleware(300), invalidateCacheMiddleware(["/api/staff*"]), eventEmitterMiddleware(EventTypes.STAFF_CREATED), staffModuleRoutes);
  app.use("/api/services", requireAuth, cacheMiddleware(300), invalidateCacheMiddleware(["/api/services*"]), servicesRoutes);
  app.use("/api/bookings", requireAuth, cacheMiddleware(180), invalidateCacheMiddleware(["/api/bookings*", "/api/clients*"]), eventEmitterMiddleware(EventTypes.BOOKING_CREATED), bookingsRoutes);
  // NOTE: appointments/availability are intentionally not mounted in v1.2 canonicalization
  // until the availability subsystem is rebuilt against the enabled migration chain.
  app.use("/api/payments", requireAuth, cacheMiddleware(60), paymentsModuleRoutes);
  app.post("/api/payments/webhook", paymentsWebhookHandler);
  app.use("/api/crm", requireAuth, cacheMiddleware(300), invalidateCacheMiddleware(["/api/crm*"]), crmRoutes);
  app.use("/api/inventory", requireAuth, cacheMiddleware(300), invalidateCacheMiddleware(["/api/inventory*"]), inventoryRoutes);
  app.use("/api/delivery", requireAuth, cacheMiddleware(180), deliveryRoutes);
  app.use("/api/support", requireAuth, supportRoutes);
  app.use("/api/tenant", requireAuth, cacheMiddleware(600), tenantRoutes);
  app.use("/api/tenants", requireAuth, cacheMiddleware(600), tenantsRoutes);
  app.use("/api/subscriptions", requireAuth, cacheMiddleware(600), subscriptionsRoutes);

  // Extended modules (may require schema completion via additive migrations)
  app.use("/api/discovery", discoveryRoutes);
  app.use("/api/clinical", requireAuth, clinicalRoutes);
  app.use("/api/emergency", requireAuth, emergencyRoutes);
  app.use("/api/finance", requireAuth, financeRoutes);
  app.use("/api/ai", requireAuth, aiRoutes);
  app.use("/api/notifications", requireAuth, notificationsRoutes);
  app.use("/api/campaigns", requireAuth, campaignsRoutes);
  app.use("/api/reporting", requireAuth, reportingRoutes);
  app.use("/api/analytics", requireAuth, analyticsRoutes);
  app.use("/api/platform", requireAuth, resolveOrganizationContext, platformRoutes);
  app.use("/api/media", requireAuth, mediaRoutes);
  app.use("/api/reviews", requireAuth, reviewsRoutes);
  app.use("/api/marketplace", requireAuth, marketplaceRoutes);
  app.use("/api/social", requireAuth, socialRoutes);
  app.use("/api/social/auth", requireAuth, socialOAuthRoutes);
  app.use("/api/video/consultations", requireAuth, videoConsultationRoutes);
  app.use("/api/automation", requireAuth, automationRoutes);
  app.use("/api/providers", requireAuth, providersRoutes);
  app.use("/api/geofence", requireAuth, geofenceRoutes);
  app.use("/api/chatbot", requireAuth, chatbotRoutes);
  app.use("/api/video", requireAuth, videoRoutes);
  app.use("/api/canva", requireAuth, canvaRoutes);
  app.use("/api/payments/multi", requireAuth, multiPaymentRoutes);
  app.use("/api/categories", requireAuth, categoriesRoutes);
  app.use("/api/bookings/workflow", requireAuth, bookingWorkflowRoutes);
  app.use("/api/schema", requireAuth, schemaRoutes);

  // Billing & Monetization
  app.use("/api/billing", requireAuth, billingRoutes);

  // Workflow Engine & State Management
  app.use("/api/workflows", requireAuth, workflowRoutes);

  // Content / Blog
  app.use("/api/content/public", publicContentRoutes);
  app.use("/api/content", requireAuth, contentRoutes);

  // ==========================================
  // JSON 404 HANDLER FOR UNMOUNTED /api/* (BEFORE static files)
  // ==========================================
  app.use("/api", apiNotFoundHandler);

  // ==========================================
  // FRONTEND STATIC FILES + SPA ROUTING
  // ==========================================
  app.use(express.static(frontendDist));

  // SPA fallback: serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });

  // ==========================================
  // GLOBAL ERROR HANDLER (MUST BE LAST)
  // ==========================================
  app.use(enhancedErrorHandler);
  return app;
}

// Export the app instance for testing
export const app = createApp();
