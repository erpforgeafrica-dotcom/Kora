# Production Hardening - Quick Reference

## 5-Minute Integration Checklist

### 1. Add Validation to Any Endpoint
```typescript
import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { createClientSchema } from "../shared/schemas.js";

const router = Router();

// Before
router.post("/clients", async (req, res) => {
  const client = req.body; // ❌ No validation
});

// After
router.post(
  "/clients",
  validateBody(createClientSchema),
  async (req, res) => {
    const client = req.body; // ✅ Validated & typed
  }
);
```

### 2. Use Error Classes
```typescript
import { NotFoundError, ValidationError, asyncHandler } from "../middleware/enhancedErrorHandler.js";

router.get(
  "/clients/:id",
  asyncHandler(async (req, res) => {
    const client = await queryDb("SELECT * FROM clients WHERE id = $1", [req.params.id]);
    
    if (!client.length) {
      throw new NotFoundError("Client not found"); // ✅ Auto-handled, 404 response
    }
    
    res.json(client[0]);
  })
);
```

### 3. Add Rate Limiting
```typescript
import { apiLimiter } from "../middleware/rateLimiter.js";

// In app.ts
app.use("/api/external", apiLimiter, externalRoutes);
```

### 4. API Key Protection
```typescript
import { validateApiKey } from "../middleware/rateLimiter.js";

router.post(
  "/webhook",
  validateApiKey, // ✅ Requires X-API-Key header
  async (req, res) => {
    // Handle webhook
  }
);
```

### 5. Query Monitoring
```typescript
import { queryDb, getQueryMetrics } from "../db/optimized.js";

// All queries automatically monitored
const users = await queryDb("SELECT * FROM users WHERE org_id = $1", [orgId]);

// Get metrics
const metrics = getQueryMetrics();
console.log(`Avg query time: ${metrics.averageDuration}ms`);
```

---

## Common Patterns

### Pattern 1: CRUD with Validation
```typescript
import { Router } from "express";
import { validateBody } from "../middleware/validate.js";
import { createClientSchema, updateClientSchema } from "../shared/schemas.js";
import { NotFoundError, asyncHandler } from "../middleware/enhancedErrorHandler.js";

const router = Router();

// CREATE
router.post(
  "/",
  validateBody(createClientSchema),
  asyncHandler(async (req, res) => {
    const result = await queryDb(
      "INSERT INTO clients (...) VALUES (...) RETURNING *",
      [req.body.full_name, req.body.email]
    );
    res.status(201).json(result[0]);
  })
);

// READ
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await queryDb(
      "SELECT * FROM clients WHERE id = $1 AND org_id = $2",
      [req.params.id, req.headers["x-org-id"]]
    );
    if (!result.length) throw new NotFoundError("Client not found");
    res.json(result[0]);
  })
);

// UPDATE
router.patch(
  "/:id",
  validateBody(updateClientSchema),
  asyncHandler(async (req, res) => {
    const result = await queryDb(
      "UPDATE clients SET ... WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (!result.length) throw new NotFoundError("Client not found");
    res.json(result[0]);
  })
);

// DELETE
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const result = await queryDb(
      "DELETE FROM clients WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (!result.length) throw new NotFoundError("Client not found");
    res.status(204).send();
  })
);
```

### Pattern 2: Paginated List
```typescript
import { validateQuery } from "../middleware/validate.js";
import { paginationSchema } from "../shared/schemas.js";

router.get(
  "/",
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const results = await queryDb(
      "SELECT * FROM clients WHERE org_id = $1 LIMIT $2 OFFSET $3",
      [req.headers["x-org-id"], limit, offset]
    );

    const countResult = await queryDb(
      "SELECT COUNT(*) as count FROM clients WHERE org_id = $1",
      [req.headers["x-org-id"]]
    );

    res.json({
      data: results,
      pagination: {
        page,
        limit,
        total: parseInt(countResult[0].count),
        pages: Math.ceil(parseInt(countResult[0].count) / limit),
      },
    });
  })
);
```

### Pattern 3: External Integration with API Key
```typescript
import { validateApiKey } from "../middleware/rateLimiter.js";
import { validateBody } from "../middleware/validate.js";
import { z } from "zod";

const webhookSchema = z.object({
  event: z.string(),
  data: z.record(z.unknown()),
});

router.post(
  "/webhook",
  validateApiKey,
  validateBody(webhookSchema),
  asyncHandler(async (req, res) => {
    const { event, data } = req.body;
    // Process webhook
    res.json({ success: true });
  })
);
```

---

## Environment Setup

### Development
```bash
# .env
DB_POOL_MAX=5
DB_POOL_MIN=1
SLOW_QUERY_THRESHOLD=500
VALID_API_KEYS=dev_key_12345
LOG_LEVEL=debug
DEBUG=true
```

### Production
```bash
# .env.prod
DB_POOL_MAX=20
DB_POOL_MIN=5
SLOW_QUERY_THRESHOLD=1000
VALID_API_KEYS=prod_key_xxxxx,prod_key_yyyyy
LOG_LEVEL=info
DEBUG=false
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Testing Your Integration

### Test Validation
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{"full_name": "", "email": "invalid"}'
# Response: 422 with validation errors
```

### Test Error Handling
```bash
curl http://localhost:3000/api/clients/nonexistent
# Response: 404 with error details
```

### Test Rate Limiting
```bash
for i in {1..101}; do
  curl http://localhost:3000/api/clients
done
# After 100 requests: 429 Too Many Requests
```

### Test API Key
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "X-API-Key: invalid_key" \
  -H "Content-Type: application/json" \
  -d '{}'
# Response: 403 Forbidden
```

### Test Metrics
```bash
curl http://localhost:3000/api/health/metrics
# Response: Database pool and query metrics
```

---

## Troubleshooting

### Issue: "Validation error" on valid input
**Solution**: Check schema definition matches request body structure

### Issue: Rate limit too strict
**Solution**: Adjust `DB_POOL_MAX` or use `createOrgRateLimiter(n)` with higher limit

### Issue: Slow queries not logged
**Solution**: Lower `SLOW_QUERY_THRESHOLD` in .env

### Issue: API key validation failing
**Solution**: Ensure `VALID_API_KEYS` is set and client sends `X-API-Key` header

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/shared/schemas.ts` | Zod validation schemas |
| `src/middleware/validate.ts` | validateBody, validateQuery middleware |
| `src/middleware/enhancedErrorHandler.ts` | Error classes & handler |
| `src/middleware/rateLimiter.ts` | Rate limiting & API key auth |
| `src/db/optimized.ts` | Connection pooling & metrics |
| `src/middleware/apiVersioning.ts` | API versioning |

---

## Next Steps

1. ✅ Review `PHASE_2_PRODUCTION_HARDENING.md` for detailed docs
2. ✅ Run tests: `npm run test -- phase2-production-hardening.test.ts`
3. ⏭️ Update existing modules to use validation schemas
4. ⏭️ Configure Sentry for error tracking
5. ⏭️ Set up monitoring dashboard for metrics

---

## Support

For questions or issues:
1. Check `PHASE_2_PRODUCTION_HARDENING.md` for detailed documentation
2. Review test file: `src/test/phase2-production-hardening.test.ts`
3. Check example patterns above
