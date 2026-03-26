# Phase 5 - Error Standardization - Technical Reference

## Canonical Error Response Format

### Success Response
```typescript
interface SuccessResponse<T> {
  data: T | T[];
  meta?: {
    pagination?: { page: number; limit: number; total: number };
    timestamp?: string;
    requestId?: string;
  };
}

// Example
{
  "data": [{ "id": "1", "name": "John" }],
  "meta": { "timestamp": "2026-03-22T20:00:00Z" }
}
```

### Error Response (CANONICAL)
```typescript
interface ErrorResponse {
  error: {
    code: string;              // UPPERCASE error code
    message: string;           // Human-readable message
    context?: {
      errors?: Record<string, string | string[]>;  // Validation errors only
    };
  };
}

// Example: Validation Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "context": {
      "errors": {
        "email": "Invalid email format",
        "age": ["Must be >= 18", "Must be <= 120"]
      }
    }
  }
}

// Example: Business Logic Error
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Invoice not found (id: inv-123)"
  }
}

// Example: Auth Error
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

## Standard Error Codes (Uppercase)

| HTTP Code | Error Code | Meaning | Use Case |
|-----------|-----------|---------|----------|
| 400 | `BAD_REQUEST` | Request body format invalid | Malformed JSON, invalid types |
| 400 | `VALIDATION_ERROR` | Schema validation failed | Fields missing, constraints violated |
| 401 | `UNAUTHORIZED` | Auth token missing/invalid | No token, expired, tampered |
| 403 | `FORBIDDEN` | User lacks permission | Role/org mismatch, RBAC denial |
| 404 | `NOT_FOUND` | Resource doesn't exist | Entity lookup returned null |
| 409 | `CONFLICT` | Business logic violation | Duplicate, state conflict, race condition |
| 422 | `UNPROCESSABLE_ENTITY` | Request semantically invalid | Valid format but impossible to process |
| 429 | `RATE_LIMITED` | Too many requests | Quota exceeded, backoff required |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected error | Unhandled exception, DB error |

## Implementation Files

### 1. Error Handler Middleware
**File**: `backend/src/middleware/enhancedErrorHandler.ts`
```typescript
export const enhancedErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode, code, message, context } = getErrorDetails(err);
  
  return res.status(statusCode).json({
    error: {
      code,
      message,
      ...(context && { context })
    }
  });
};
```

### 2. Validation Middleware
**File**: `backend/src/middleware/validate.ts`
```typescript
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body validation failed",
          context: {
            errors: parseZodErrors(result.error)
          }
        }
      });
    }
    next();
  };
};
```

### 3. Error Code Mapping
**File**: `backend/src/shared/errorCodes.ts` (Create this)
```typescript
export const errorCodeMap = {
  // Client errors (400s)
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  RATE_LIMITED: 429,
  
  // Server errors (500s)
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = errorCodeMap[code] || 500,
    public context?: Record<string, any>
  ) {
    super(message);
  }
}
```

## Test Patterns

### Create Test App with Mocks
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "./testAppFactory.js";

const { queryDbMock, authMockFactory } = vi.hoisted(() => ({
  queryDbMock: vi.fn(),
  authMockFactory: async (importOriginal) => {
    const actual = await importOriginal();
    return {
      ...actual,
      requireAuth: (req, res, next) => {
        req.user = { id: "test-user", role: "platform_admin", organization_id: "org-001" };
        res.locals.auth = {
          userId: "test-user",
          userRole: "platform_admin",
          organizationId: "org-001",
          sessionId: null,
          tokenJti: null
        };
        next();
      }
    };
  }
}));

vi.mock("../db/client.js", () => ({ queryDb: queryDbMock }));
vi.mock("../middleware/auth.js", { ...authMockFactory });

describe("My API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns canonical error on validation failure", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/endpoint")
      .set("Authorization", "Bearer valid-token")
      .send({ invalidField: true });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.context.errors).toBeDefined();
  });
});
```

### JWT Token Generation (No Session Validation)
```typescript
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test-secret";

// Test token (no jti field = skip session validation)
const testToken = jwt.sign(
  {
    userId: "test-user",
    organizationId: "org-001",
    userRole: "business_admin"
    // NO jti field
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);

// Production token (with jti field = requires session validation)
const prodToken = jwt.sign(
  {
    userId: "user-id",
    organizationId: "org-id",
    userRole: "role",
    jti: `jti-${Date.now()}`  // ← Session record lookup required
  },
  JWT_SECRET,
  { expiresIn: "1h" }
);
```

## Testing Validation Errors

### Example: Finance Invoice Creation
```typescript
describe("POST /api/finance/invoices", () => {
  it("returns VALIDATION_ERROR with nested errors", async () => {
    const app = await createTestApp();
    const res = await request(app)
      .post("/api/finance/invoices")
      .set("Authorization", "Bearer test")
      .send({ 
        amount_cents: -500,  // Invalid: negative
        due_date: "not-a-date"  // Invalid: not ISO date
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.context.errors).toEqual({
      amount_cents: "Must be positive",
      due_date: "Invalid ISO date format"
    });
  });

  it("returns NOT_FOUND when client doesn't exist", async () => {
    queryDbMock.mockResolvedValueOnce(null);  // Client not found

    const app = await createTestApp();
    const res = await request(app)
      .post("/api/finance/invoices")
      .set("Authorization", "Bearer test")
      .send({ client_id: "missing", amount_cents: 5000, due_date: "2025-12-31" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
    expect(res.body.error.message).toContain("client");
  });
});
```

## Migration Path for Existing Endpoints

### Before (Inconsistent)
```typescript
// Some endpoints
res.status(400).json({ error: "missing_field" });

// Others
res.status(400).json({ message: "Field required" });

// Still others
res.status(400).json({ 
  error: { 
    code: "invalid_request",
    errors: { field: "error" } 
  } 
});
```

### After (Canonical)
```typescript
// ALL endpoints use this
res.status(400).json({
  error: {
    code: "VALIDATION_ERROR",  // ← UPPERCASE
    message: "Field required",
    context: { errors: { field: "error" } }  // ← After colon
  }
});
```

## Logging with Error Context

```typescript
import { logger } from "../shared/logger.js";

// In middleware
logger.error("Payment processing failed", {
  organizationId: res.locals.auth?.organizationId,
  requestId: req.id,
  errorCode: err.code,
  statusCode: statusCode,
  userId: res.locals.auth?.userId
});

// Output (structured)
{
  "timestamp": "2026-03-22T20:00:00Z",
  "level": "ERROR",
  "message": "Payment processing failed",
  "organizationId": "org-001",
  "requestId": "req-123",
  "errorCode": "CONFLICT",
  "statusCode": 409,
  "userId": "user-001"
}
```

## API Documentation Template

For each endpoint, document error responses:

```markdown
## POST /api/finance/invoices

### Success (201)
```json
{
  "data": {
    "id": "inv-123",
    "status": "pending",
    "amount_cents": 10000
  }
}
```

### Client Errors

**400 - VALIDATION_ERROR**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "context": {
      "errors": {
        "amount_cents": "Must be positive",
        "due_date": "Invalid ISO date"
      }
    }
  }
}
```

**404 - NOT_FOUND**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Client not found (id: c-123)"
  }
}
```

### Server Errors

**500 - INTERNAL_SERVER_ERROR**
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Unexpected server error"
  }
}
```
```

---

## Deployment Checklist

- [ ] All core middleware updated (`enhancedErrorHandler`, `validate`, `errorHandler`)
- [ ] All routes use `AppError` for custom errors
- [ ] Error codes are UPPERCASE
- [ ] Validation errors nested under `context.errors`
- [ ] Tests use `error.code` assertions (not `error`)
- [ ] JWT test tokens omit `jti` field
- [ ] Mock patterns use vi.hoisted for vi.mock()
- [ ] 175+ integration tests passing
- [ ] API documentation updated with error examples
- [ ] Frontend tested against new error format
- [ ] Production deployment ready

---

**Last Updated**: March 22, 2026  
**Status**: Ready for Production ✅
