# Route Validation Strategy - Zod Schemas

**Status**: Implementation Guide  
**Priority**: HIGH (medium complexity, high impact)  
**Scope**: All 70+ backend routes  

---

## GOAL

Replace ad-hoc input validation with **Zod schemas** — providing:
- Single source of truth for request contracts
- Type-safe validation (compile-time + runtime)
- Reusable schemas across routes
- Comprehensive error reporting
- Frontend code generation ready

---

## CURRENT STATE (Problems)

### Before: Ad-Hoc Validation
```typescript
// booking/routes.ts (current - fragile)
bookingRoutes.post("/create", async (req, res) => {
  const { clientId, date, slotId } = req.body;
  
  // Scattered validation
  if (!clientId || typeof clientId !== "string") {
    return respondError(res, "INVALID_CLIENT", "Client ID required", 400);
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return respondError(res, "INVALID_DATE", "Date format required", 400);
  }
  // ... more checks
  
  // Hard to test, easy to miss edge cases, no reuse
});
```

**Issues**:
- Validation logic scattered across 70+ routes
- Different validation patterns (if checks, regex, type guards)
- No shared error format
- Frontend has no way to know expected shapes
- Documentation out of sync with code
- Duplicated validation for same resource (e.g., email in 5 different routes)

---

## TARGET STATE (Solution)

### After: Centralized Zod Schemas
```typescript
// shared/validation/bookingSchemas.ts (single source of truth)
export const createBookingSchema = z.object({
  clientId: z.string().uuid("Client ID must be valid UUID"),
  date: z.string().date("Date must be YYYY-MM-DD format"),
  slotId: z.string().uuid("Slot ID must be valid UUID"),
  notes: z.string().optional().default(""),
});

export type CreateBookingRequest = z.infer<typeof createBookingSchema>;

// booking/routes.ts (clean validation)
bookingRoutes.post("/create", validateRequest(createBookingSchema), async (req, res) => {
  const { clientId, date, slotId, notes } = req.body; // Type-safe!
  
  // req.body is now guaranteed valid
  // No additional validation needed here
  
  const booking = await createBooking(clientId, date, slotId, notes);
  return respondSuccess(res, booking, 201);
});
```

**Benefits**:
- ✅ Validation in one place (schema)
- ✅ Type inference for TypeScript
- ✅ Consistent error responses
- ✅ Reusable validation rules
- ✅ Easy to test (unit test schemas)
- ✅ Frontend can import types

---

## Implementation Plan

### Phase 1: Infrastructure (Days 1-2)

**1.1** Create validation error formatter:
```typescript
// src/shared/validation/formatter.ts
export function formatValidationErrors(error: ZodError): ValidationErrorResponse {
  return {
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
    errors: error.errors.map(e => ({
      path: e.path.join("."),
      message: e.message,
      code: e.code,
    })),
  };
}
```

**1.2** Create validation middleware:
```typescript
// src/middleware/validateRequest.ts
export function validateRequest(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return respondError(res, "VALIDATION_ERROR", formatValidationErrors(error), 422);
      }
      next(error);
    }
  };
}

// Aliases for query/params
export const validateQuery = (schema: ZodSchema) => // similar
export const validateParams = (schema: ZodSchema) => // similar
```

**1.3** Create schema helper utilities:
```typescript
// src/shared/validation/common.ts
export const commonSchemas = {
  // IDs (UUID v4)
  userId: z.string().uuid("Invalid user ID format"),
  organizationId: z.string().uuid("Invalid organization ID format"),
  bookingId: z.string().uuid("Invalid booking ID format"),
  
  // Contact
  email: z.string().email("Invalid email format"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format"),
  
  // Dates
  dateISO: z.string().date("Date must be YYYY-MM-DD format"),
  dateTime: z.string().datetime("DateTime must be ISO-8601 format"),
  
  // Roles (from auth middleware)
  userRole: z.enum([
    "platform_admin",
    "business_admin",
    "operations",
    "staff",
    "client",
    "doctor",
    "nurse",
    // ...
  ]),
  
  // Common fields
  paginationLimit: z.number().min(1).max(1000).default(50),
  paginationOffset: z.number().min(0).default(0),
};

// Usage:
export const createBookingSchema = z.object({
  clientId: commonSchemas.userId,
  date: commonSchemas.dateISO,
  slotId: commonSchemas.userId,
  notes: z.string().max(1000).optional(),
});
```

### Phase 2: Core Modules (Days 3-7)

Organize schemas by module domain:

```
src/shared/validation/
├── common.ts               # Shared IDs, emails, dates, roles
├── common.spec.ts          # Unit tests for common schemas
├── bookings.ts             # All booking-related schemas
├── appointments.ts         # All appointment-related schemas
├── payments.ts             # All payment-related schemas
├── clients.ts              # All client-related schemas
├── reporting.ts            # All reporting-related schemas
├── notifications.ts        # All notification-related schemas
├── finance.ts              # All finance-related schemas
└── index.ts               # Export all schemas

// Example: bookings.ts
export const createBookingSchema = z.object({
  clientId: commonSchemas.userId,
  date: commonSchemas.dateISO,
  slotId: commonSchemas.userId,
  notes: z.string().max(1000).optional().default(""),
});

export const updateBookingSchema = z.object({
  id: commonSchemas.bookingId,
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  notes: z.string().max(1000).optional(),
});

export const listBookingsSchema = z.object({
  limit: commonSchemas.paginationLimit,
  offset: commonSchemas.paginationOffset,
  clientId: commonSchemas.userId.optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
});

export type CreateBookingRequest = z.infer<typeof createBookingSchema>;
export type UpdateBookingRequest = z.infer<typeof updateBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsSchema>;
```

### Phase 3: Update Routes (Days 8-12)

For each module, add validation middleware:

```typescript
// BEFORE (current)
bookingRoutes.post("/", async (req, res, next) => {
  try {
    if (!req.body?.clientId) return respondError(res, "...", 400);
    // ... more checks
    const booking = await createBooking(req.body);
    respondSuccess(res, booking, 201);
  } catch (err) { next(err); }
});

// AFTER (with Zod)
import { createBookingSchema } from "../../shared/validation/bookings.js";
import { validateRequest } from "../../middleware/validateRequest.js";

bookingRoutes.post(
  "/",
  validateRequest(createBookingSchema),
  async (req, res, next) => {
    try {
      const booking = await createBooking(req.body);
      respondSuccess(res, booking, 201);
    } catch (err) { next(err); }
  }
);
```

**Priority order** (by module risk):
1. **HIGH**: payments, finance, clinical (regulatory)
2. **MEDIUM**: bookings, appointments, notifications
3. **LOW**: settings, features, analytics

### Phase 4: Frontend Integration (Days 13-14)

Generate TypeScript types from Zod schemas:

```typescript
// frontend/src/types/api.ts (auto-generated or imported)
import type {
  CreateBookingRequest,
  UpdateBookingRequest,
  ListBookingsQuery,
} from "../../../backend/src/shared/validation/bookings.js";

// Use in API calls:
const createBooking = async (data: CreateBookingRequest) => {
  return api.post("/bookings", data);
};
```

---

## Validation Patterns by Route Type

### CREATE (POST)
```typescript
export const createXSchema = z.object({
  // Required fields with type checking
  name: z.string().min(1).max(100),
  email: z.string().email(),
  
  // Optional with defaults
  status: z.enum(["active", "inactive"]).default("active"),
  metadata: z.record(z.string()).optional(),
  
  // Derived/computed (set by service, not client)
  // organizationId is from auth context, not input
});

// Usage in route:
const organizationId = getRequiredOrganizationId(res);
const data = req.body; // Already validated as CreateXRequest
const result = await service.create(organizationId, data);
```

### UPDATE (PATCH/PUT)
```typescript
export const updateXSchema = z.object({
  id: commonSchemas.userId, // From path param
  
  // All fields optional
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  
  // Computed fields not allowed in PATCH
  createdAt: z.never().optional(), // Explicitly prevent
});

// Usage:
updateXRoutes.patch(
  "/:id",
  validateParams(z.object({ id: commonSchemas.userId })),
  validateRequest(updateXSchema.omit({ id: true })), // id from path
  async (req, res) => {
    const id = req.params.id;
    const result = await service.update(id, req.body);
  }
);
```

### LIST (GET with query params)
```typescript
export const listXSchema = z.object({
  limit: commonSchemas.paginationLimit,
  offset: commonSchemas.paginationOffset,
  search: z.string().max(100).optional(),
  filter: z.enum(["active", "inactive"]).optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Usage:
listXRoutes.get(
  "/",
  validateQuery(listXSchema),
  async (req, res) => {
    const items = await service.list(organizationId, req.query);
    respondList(res, items, listXSchema.parse(req.query));
  }
);
```

---

## Error Response Format (Standardized)

```typescript
// On validation error:
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "errors": [
    {
      "path": "clientId",
      "message": "Invalid user ID format",
      "code": "invalid_string"
    },
    {
      "path": "date",
      "message": "Date must be YYYY-MM-DD format",
      "code": "invalid_string"
    }
  ]
}
```

---

## Testing Strategy

### Unit: Test schemas in isolation
```typescript
// shared/validation/bookings.spec.ts
describe("createBookingSchema", () => {
  it("accepts valid booking", () => {
    const data = {
      clientId: "123e4567-e89b-12d3-a456-426614174000",
      date: "2026-04-29",
      slotId: "123e4567-e89b-12d3-a456-426614174001",
    };
    expect(() => createBookingSchema.parse(data)).not.toThrow();
  });

  it("rejects invalid date format", () => {
    const data = {
      clientId: "123e4567-e89b-12d3-a456-426614174000",
      date: "29-04-2026", // Wrong format
      slotId: "123e4567-e89b-12d3-a456-426614174001",
    };
    expect(() => createBookingSchema.parse(data)).toThrow();
  });
});
```

### Integration: Test routes with invalid data
```typescript
// modules/bookings/routes.spec.ts
describe("POST /bookings", () => {
  it("returns 422 on validation error", async () => {
    const response = await supertest(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${token}`)
      .send({ clientId: "not-a-uuid", date: "invalid" });

    expect(response.status).toBe(422);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.errors.length).toBeGreaterThan(0);
  });
});
```

---

## Rollout Plan

1. **Week 1**: Infrastructure + common schemas + tests
2. **Week 2**: Core modules (payments, bookings, appointments)
3. **Week 3**: Secondary modules (notifications, reporting, finance)
4. **Week 4**: Complete rollout + documentation

---

## Files to Create/Modify

**Create**:
- `src/shared/validation/common.ts`
- `src/shared/validation/bookings.ts`
- `src/shared/validation/appointments.ts`
- ... (one per module)
- `src/shared/validation/formatter.ts`
- `src/middleware/validateRequest.ts`

**Modify**:
- All `src/modules/*/routes.ts` files (add validation middleware)
- `src/app.ts` (import validation utilities)
- `frontend/src/types/api.ts` (import/generate types)

---

## Success Criteria

- [ ] All routes have Zod validation
- [ ] No manual type-checking in route handlers
- [ ] Validation tests pass (unit + integration)
- [ ] Error responses have consistent format
- [ ] Frontend has TypeScript types for all requests
- [ ] Validation catches 95%+ of invalid inputs before service layer
- [ ] Regression tests pass (0 breaking changes)
