# Persistence Layer & Repository Strategy

**Goal**: Move ALL raw SQL from route handlers into repositories with typed contracts.

**Current State**: Raw SQL scattered across modules (some in routes, some in services, some in repositories).

**Target State**: One repository layer with complete CRUD contracts for each domain entity.

---

## Problem Areas

### Before (Current - Mixed)
```typescript
// booking/routes.ts (raw SQL in handler!)
bookingRoutes.get("/:id", async (req, res) => {
  const { id } = req.params;
  const orgId = getRequiredOrganizationId(res);
  
  // Raw SQL directly in route
  const result = await queryDb(
    "SELECT * FROM bookings WHERE id = $1 AND organization_id = $2",
    [id, orgId]
  );
  
  if (!result.rows.length) return respondError(res, "NOT_FOUND", "", 404);
  return respondSuccess(res, result.rows[0]);
});

// finance/service.ts (raw SQL in service)
export async function getInvoiceSummary(orgId: string) {
  const result = await queryDb(`
    SELECT 
      COUNT(*) as invoice_count,
      SUM(amount_cents) as total_revenue_cents,
      AVG(amount_cents) as avg_invoice_cents
    FROM invoices
    WHERE organization_id = $1 AND status = 'paid'
  `, [orgId]);
  return result.rows[0];
}

// payments/routes.ts (mix of SQL and repositories)
const transaction = await getTransactionById(txId, orgId); // Good
const paymentMethods = await queryDb(
  "SELECT * FROM payment_methods WHERE org_id = $1",
  [orgId]
);  // Bad - should use repository
```

**Issues**:
- Org scoping not consistently enforced
- Duplicated queries across modules
- Hard to test (need real DB or heavy mocks)
- No type safety (results are `any`)
- SQL injection risk if refactored incorrectly
- Audit/logging difficult

---

## After (Target - Repository Layer)

```typescript
// db/repositories/BookingRepository.ts (single source of truth)
export class BookingRepository {
  async findById(id: string, organizationId: string): Promise<Booking | null> {
    const result = await queryDb(
      "SELECT * FROM bookings WHERE id = $1 AND organization_id = $2",
      [id, organizationId]
    );
    return result.rows[0] || null;
  }

  async findAll(organizationId: string, filters?: BookingFilters): Promise<Booking[]> {
    let query = "SELECT * FROM bookings WHERE organization_id = $1";
    const params: unknown[] = [organizationId];
    
    if (filters?.status) {
      query += " AND status = $" + (params.length + 1);
      params.push(filters.status);
    }
    
    const result = await queryDb(query, params);
    return result.rows;
  }

  async create(organizationId: string, data: CreateBookingInput): Promise<Booking> {
    const result = await queryDb(
      `INSERT INTO bookings (id, organization_id, client_id, date, slot_id, notes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [v4(), organizationId, data.clientId, data.date, data.slotId, data.notes, new Date()]
    );
    return result.rows[0];
  }

  async update(id: string, organizationId: string, data: UpdateBookingInput): Promise<Booking | null> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      params.push(data.notes);
    }

    if (updates.length === 0) return this.findById(id, organizationId);

    params.push(id, organizationId);
    const query = `
      UPDATE bookings
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex + 1} AND organization_id = $${paramIndex + 2}
      RETURNING *
    `;

    const result = await queryDb(query, params);
    return result.rows[0] || null;
  }

  async delete(id: string, organizationId: string): Promise<boolean> {
    const result = await queryDb(
      "DELETE FROM bookings WHERE id = $1 AND organization_id = $2",
      [id, organizationId]
    );
    return result.rowCount > 0;
  }
}

// booking/routes.ts (clean handler)
bookingRoutes.get(
  "/:id",
  validateParams(z.object({ id: commonSchemas.userId })),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const orgId = getRequiredOrganizationId(res);
      
      const booking = await bookingRepository.findById(id, orgId);
      if (!booking) return respondError(res, "NOT_FOUND", "Booking not found", 404);
      
      respondSuccess(res, booking);
    } catch (err) { next(err); }
  }
);
```

**Benefits**:
- ✅ Org scoping enforced at repository level
- ✅ Single query definition (no duplication)
- ✅ Easy to test (mock repository)
- ✅ Type-safe (TypeScript interfaces)
- ✅ Auditable (centralized logging)
- ✅ Consistent error handling

---

## Repository Pattern Guidelines

### Structure
```
src/
  db/
    repositories/
      ├── BookingRepository.ts
      ├── AppointmentRepository.ts
      ├── PaymentRepository.ts
      ├── ClientRepository.ts
      ├── FinanceRepository.ts
      ├── ReportingRepository.ts
      └── index.ts (exports all repositories)
```

### Base Pattern (CRUD)
```typescript
export class XRepository {
  async findById(id: string, organizationId: string): Promise<X | null>
  async findAll(organizationId: string, filters?: Filters): Promise<X[]>
  async create(organizationId: string, data: CreateInput): Promise<X>
  async update(id: string, organizationId: string, data: UpdateInput): Promise<X | null>
  async delete(id: string, organizationId: string): Promise<boolean>
  
  // Domain-specific queries
  async findByClientId(clientId: string, organizationId: string): Promise<X[]>
  async findByStatus(status: string, organizationId: string): Promise<X[]>
}
```

### Org Scoping Rule
**EVERY query MUST filter by organization_id:**
```typescript
// ✅ CORRECT
"SELECT * FROM bookings WHERE organization_id = $1 AND id = $2"

// ❌ WRONG (cross-org leak)
"SELECT * FROM bookings WHERE id = $1"
```

### Type Safety
```typescript
// Define input types
export interface CreateBookingInput {
  clientId: string;
  date: string;
  slotId: string;
  notes?: string;
}

export interface UpdateBookingInput {
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
}

// Return types match DB schema
export interface Booking {
  id: string;
  organization_id: string;
  client_id: string;
  date: string;
  slot_id: string;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

// Repository method signatures
async create(organizationId: string, data: CreateBookingInput): Promise<Booking>
async findById(id: string, organizationId: string): Promise<Booking | null>
```

---

## Migration Checklist

### Phase 1: Foundation (Days 1-2)
- [ ] Identify all modules with raw SQL
- [ ] List all unique queries
- [ ] Design repository interfaces
- [ ] Create base types for each domain

### Phase 2: Implementation (Days 3-7)
- [ ] Create repository class for each module
- [ ] Move queries into repository
- [ ] Add unit tests for repositories
- [ ] Audit org scoping in each query

### Phase 3: Integration (Days 8-10)
- [ ] Update routes to use repositories
- [ ] Remove raw SQL from routes
- [ ] Remove raw SQL from services
- [ ] Run integration tests

### Phase 4: Audit & Optimization (Days 11-12)
- [ ] Review all repositories for org scoping
- [ ] Add indexes for common filters
- [ ] Profile query performance
- [ ] Update documentation

---

## Key Modules to Migrate

### HIGH PRIORITY (Regulatory/Financial)
1. **PaymentRepository** - Stripe, PayPal, Flutterwave, Paystack transactions
2. **FinanceRepository** - Invoices, revenue tracking, budgets
3. **ClinicalRepository** - Patient records, sensitive health data

### MEDIUM PRIORITY
4. **BookingRepository** - Appointment bookings
5. **AppointmentRepository** - Appointment records
6. **NotificationRepository** - Notification logs
7. **ReportingRepository** - Analytics queries

### LOW PRIORITY
8. **ClientRepository**, **StaffRepository**, **TenantRepository** - Domain entities
9. **SettingsRepository** - Configuration
10. **FeatureRepository** - Feature flags

---

## Query Optimization Guidelines

### Add Indexes for Common Filters
```sql
-- After migration, add indexes for performance
CREATE INDEX idx_bookings_org_client ON bookings(organization_id, client_id);
CREATE INDEX idx_bookings_org_date ON bookings(organization_id, date);
CREATE INDEX idx_bookings_org_status ON bookings(organization_id, status);
```

### Batch Operations
```typescript
// For bulk operations, provide batch methods
async createMany(organizationId: string, items: CreateBookingInput[]): Promise<Booking[]> {
  const queries = items.map((item) => ({
    sql: "INSERT INTO bookings (...) VALUES (...) RETURNING *",
    params: [v4(), organizationId, ...Object.values(item)],
  }));
  
  const results = await Promise.all(queries.map(q => queryDb(q.sql, q.params)));
  return results.flatMap(r => r.rows);
}
```

### Pagination
```typescript
async findAll(
  organizationId: string,
  filters?: BookingFilters,
  pagination?: { limit: number; offset: number }
): Promise<{ items: Booking[]; total: number }> {
  const limit = pagination?.limit || 50;
  const offset = pagination?.offset || 0;
  
  const countResult = await queryDb(
    "SELECT COUNT(*) as count FROM bookings WHERE organization_id = $1",
    [organizationId]
  );
  
  const itemsResult = await queryDb(
    "SELECT * FROM bookings WHERE organization_id = $1 LIMIT $2 OFFSET $3",
    [organizationId, limit, offset]
  );
  
  return {
    items: itemsResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  };
}
```

---

## Testing Repositories

```typescript
// db/repositories/BookingRepository.spec.ts
describe("BookingRepository", () => {
  let repo: BookingRepository;
  let testOrgId: string;

  beforeEach(async () => {
    repo = new BookingRepository();
    testOrgId = v4();
    // Clear test data
    await queryDb("DELETE FROM bookings WHERE organization_id = $1", [testOrgId]);
  });

  it("creates booking with org scoping", async () => {
    const booking = await repo.create(testOrgId, {
      clientId: v4(),
      date: "2026-04-30",
      slotId: v4(),
    });

    expect(booking.organization_id).toBe(testOrgId);
    expect(booking.id).toBeDefined();
  });

  it("prevents cross-org access", async () => {
    const otherOrgId = v4();
    // Create booking in testOrgId
    const booking = await repo.create(testOrgId, { /* ... */ });

    // Try to access from otherOrgId
    const result = await repo.findById(booking.id, otherOrgId);
    expect(result).toBeNull();
  });
});
```

---

## Success Criteria

- [ ] All raw SQL moved to repositories
- [ ] Every query includes organization_id filter
- [ ] No SQL in route handlers
- [ ] Repository tests achieve 90%+ coverage
- [ ] Type safety: all queries return typed results
- [ ] Performance: query execution <50ms for common operations
- [ ] Audit: all mutations logged with org context
