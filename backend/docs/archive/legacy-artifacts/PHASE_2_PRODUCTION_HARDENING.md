# Production Hardening - Phase 2 Documentation

## Overview
This phase implements 5 critical production hardening features for the KORA backend:
1. Request Validation (Zod Schemas)
2. Rate Limiting + API Key Auth
3. Enhanced Error Handling & Logging
4. Database Connection Pooling & Query Optimization
5. API Versioning Strategy

---

## 1. Request Validation (Zod Schemas)

### Location
`src/shared/schemas.ts` - Centralized Zod validation schemas

### Features
- **Pagination**: `paginationSchema` - page/limit with defaults
- **Common IDs**: UUID validation for resources
- **Module-Specific Schemas**: Pre-built schemas for all core modules
  - Clients: `createClientSchema`, `updateClientSchema`
  - Appointments: `createAppointmentSchema`, `updateAppointmentStatusSchema`
  - Invoices: `createInvoiceSchema`, `updateInvoiceStatusSchema`
  - Notifications: `createNotificationSchema`
  - Reports: `dispatchReportSchema`
  - Video: `createVideoSessionSchema`
  - Emergency: `createEmergencyRequestSchema`, `updateEmergencyStatusSchema`
  - AI: `orchestrateCommandSchema`, `orchestrateFeedbackSchema`

### Usage Example
```typescript
import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { createClientSchema } from "../shared/schemas.js";

const router = Router();

router.post(
  "/clients",
  validateBody(createClientSchema),
  async (req, res) => {
    // req.body is now validated and typed
    const client = req.body;
    // ... create client
  }
);
```

### Validation Response (422 Unprocessable Entity)
```json
{
  "error": "validation_error",
  "errors": {
    "email": "Invalid email",
    "full_name": "String must contain at least 1 character(s)"
  }
}
```

---

## 2. Rate Limiting + API Key Authentication

### Location
`src/middleware/rateLimiter.ts`

### Rate Limiters
| Limiter | Window | Limit | Use Case |
|---------|--------|-------|----------|
| `apiLimiter` | 15 min | 100 req | General API endpoints |
| `authLimiter` | 15 min | 5 attempts | Auth endpoints (skip on success) |
| `webhookLimiter` | 1 min | 1000 req | Webhook endpoints |
| `createOrgRateLimiter(n)` | 1 min | n req | Per-org rate limiting |

### API Key Authentication
```typescript
import { validateApiKey } from "../middleware/rateLimiter.js";

router.post("/external-integration", validateApiKey, (req, res) => {
  const apiKey = (req as any).apiKey;
  // ... handle request
});
```

### Configuration
```env
# .env
VALID_API_KEYS=key1_xxxxx,key2_xxxxx,key3_xxxxx
```

### Client Usage
```bash
curl -X POST http://localhost:3000/api/external \
  -H "X-API-Key: key1_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"data": "value"}'
```

### Rate Limit Response (429 Too Many Requests)
```json
{
  "error": "too_many_requests",
  "message": "Too many requests, please try again later"
}
```

---

## 3. Enhanced Error Handling & Logging

### Location
`src/middleware/enhancedErrorHandler.ts`

### Error Classes
```typescript
// All extend Error and implement AppError interface
new ValidationError("Invalid input", { field: "email" })      // 422
new NotFoundError("Resource not found")                        // 404
new UnauthorizedError("Missing token")                         // 401
new ForbiddenError("Insufficient permissions")                 // 403
new ConflictError("Resource already exists")                   // 409
new InternalServerError("Database connection failed")          // 500
```

### Async Error Wrapper
```typescript
import { asyncHandler } from "../middleware/enhancedErrorHandler.js";

router.get(
  "/data",
  asyncHandler(async (req, res) => {
    const data = await fetchData();
    res.json(data);
    // Errors automatically caught and passed to error handler
  })
);
```

### Structured Logging
All errors logged with:
- Timestamp
- Status code & error code
- Request path, method, IP
- User ID & Organization ID
- Error context
- Stack trace (development only)

### Example Error Response
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid input",
  "context": {
    "field": "email"
  }
}
```

### Sentry Integration (Ready)
```typescript
// TODO: Uncomment when Sentry is configured
// import * as Sentry from "@sentry/node";
// Sentry.captureException(err, { extra: errorLog });
```

---

## 4. Database Connection Pooling & Query Optimization

### Location
`src/db/optimized.ts`

### Pool Configuration
```env
# .env
DB_POOL_MAX=20                    # Max connections
DB_POOL_MIN=5                     # Min connections
DB_IDLE_TIMEOUT=30000             # 30 seconds
DB_CONNECTION_TIMEOUT=5000        # 5 seconds
DB_STATEMENT_TIMEOUT=30000        # 30 seconds
DB_QUERY_TIMEOUT=30000            # 30 seconds
SLOW_QUERY_THRESHOLD=1000         # 1 second
```

### Query Monitoring
- Automatic slow query detection (logs queries > threshold)
- Query metrics tracking (last 1000 queries)
- Pool health monitoring

### Metrics Endpoint
```bash
curl http://localhost:3000/api/health/metrics
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z",
  "database": {
    "totalQueries": 1250,
    "recentQueries": 100,
    "averageDuration": 45,
    "slowQueries": 3,
    "poolSize": 20,
    "idleCount": 15,
    "waitingCount": 0
  }
}
```

### Usage
```typescript
import { queryDb, getQueryMetrics } from "../db/optimized.js";

// Queries automatically monitored
const users = await queryDb("SELECT * FROM users WHERE org_id = $1", [orgId]);

// Get metrics
const metrics = getQueryMetrics();
```

---

## 5. API Versioning Strategy

### Location
`src/middleware/apiVersioning.ts`

### Supported Versions
| Version | Status | Description |
|---------|--------|-------------|
| v1 | Active | Initial release |
| v2 | Active | Enhanced validation, rate limiting, error handling |
| v3 | Deprecated | Sunset: 2025-06-01 |

### Version Specification (Priority Order)
1. Header: `api-version: v2`
2. Query: `?api_version=v2`
3. Default: `v2`

### Client Usage
```bash
# Via header
curl -H "api-version: v2" http://localhost:3000/api/clinical/patients

# Via query parameter
curl http://localhost:3000/api/clinical/patients?api_version=v2

# Default (v2)
curl http://localhost:3000/api/clinical/patients
```

### Response Headers
```
API-Version: v2
Deprecation: true (if deprecated)
Sunset: Wed, 01 Jun 2025 00:00:00 GMT (if deprecated)
```

### API Documentation Endpoint
```bash
curl http://localhost:3000/api/docs
```

Returns:
- All supported versions
- Module list with endpoints
- Authentication requirements
- Rate limit info

### Versioned Response Wrapper
```typescript
import { versionedResponse } from "../middleware/apiVersioning.js";

router.get("/data", (req, res) => {
  const data = { id: 1, name: "Test" };
  res.json(versionedResponse(req, data));
});
```

Response:
```json
{
  "apiVersion": "v2",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "id": 1,
    "name": "Test"
  }
}
```

---

## Integration with Existing Modules

### Clinical Module Example
```typescript
import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { createAppointmentSchema } from "../shared/schemas.js";
import { asyncHandler } from "../middleware/enhancedErrorHandler.js";
import { NotFoundError, ValidationError } from "../middleware/enhancedErrorHandler.js";

const router = Router();

router.post(
  "/appointments",
  validateBody(createAppointmentSchema),
  asyncHandler(async (req, res) => {
    const { patient_id, staff_id, scheduled_at, duration_minutes } = req.body;
    
    // Validate patient exists
    const patient = await queryDb(
      "SELECT id FROM patients WHERE id = $1 AND org_id = $2",
      [patient_id, req.headers["x-org-id"]]
    );
    
    if (!patient.length) {
      throw new NotFoundError("Patient not found");
    }
    
    // Create appointment
    const result = await queryDb(
      "INSERT INTO appointments (...) VALUES (...) RETURNING *",
      [patient_id, staff_id, scheduled_at, duration_minutes]
    );
    
    res.status(201).json(versionedResponse(req, result[0]));
  })
);
```

---

## Testing

### Run Production Hardening Tests
```bash
npm run test -- src/test/phase2-production-hardening.test.ts
```

### Test Coverage
- ✅ Zod validation (body, query, schemas)
- ✅ Error handling (all error types)
- ✅ API versioning (header, query, default, deprecated)
- ✅ Rate limiting configuration
- ✅ Database pooling metrics
- ✅ Integration tests

---

## Environment Variables Summary

```env
# Database Pooling
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
DB_STATEMENT_TIMEOUT=30000
DB_QUERY_TIMEOUT=30000
SLOW_QUERY_THRESHOLD=1000

# Rate Limiting & API Keys
VALID_API_KEYS=key1,key2,key3

# Error Logging
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info
DEBUG=false

# API Versioning
API_BASE_URL=http://localhost:3000/api
DEFAULT_API_VERSION=v2
```

---

## Next Steps

1. **Sentry Integration**: Uncomment Sentry code in `enhancedErrorHandler.ts` and configure `SENTRY_DSN`
2. **Module Migration**: Update all module routes to use validation schemas
3. **Monitoring Dashboard**: Build dashboard using `/api/health/metrics` endpoint
4. **Load Testing**: Test rate limiters and connection pooling under load
5. **API Documentation**: Generate OpenAPI/Swagger from versioning metadata

---

## Files Created/Modified

### Created
- `src/shared/schemas.ts` - Zod validation schemas
- `src/middleware/rateLimiter.ts` - Rate limiting & API key auth
- `src/middleware/enhancedErrorHandler.ts` - Error handling & logging
- `src/db/optimized.ts` - Connection pooling & query optimization
- `src/middleware/apiVersioning.ts` - API versioning strategy
- `src/test/phase2-production-hardening.test.ts` - Comprehensive tests

### Modified
- `src/app.ts` - Integrated all hardening components
- `.env.example` - Added new configuration variables

---

## Metrics & Monitoring

### Key Metrics to Track
1. **Query Performance**: Average duration, slow query count
2. **Connection Pool**: Active, idle, waiting connections
3. **Rate Limiting**: Requests blocked, API key usage
4. **Error Rates**: By type, by module, by endpoint
5. **API Version Usage**: Requests per version

### Health Check
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/health/metrics
```

---

## Security Considerations

✅ **Implemented**
- Rate limiting prevents brute force attacks
- API key validation for external integrations
- Structured error logging (no sensitive data in responses)
- Connection pooling prevents resource exhaustion
- Request validation prevents injection attacks

⚠️ **Recommended**
- Enable HTTPS in production
- Rotate API keys regularly
- Monitor Sentry for security-related errors
- Set up alerts for rate limit violations
- Regular security audits of validation schemas
