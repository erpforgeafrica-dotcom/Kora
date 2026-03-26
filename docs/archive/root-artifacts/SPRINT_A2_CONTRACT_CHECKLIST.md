# Sprint A2 API Contract Checklist
## For Agent B - Frontend Integration Verification

### Purpose
Before integrating Sprint A2 endpoints into frontend components, Agent B must verify that API response shapes match the expected TypeScript interfaces.

---

## Contract Verification Checklist

### 1. Client Endpoints

#### ✅ POST /api/clients (Create)
**Expected Response Shape:**
```typescript
{
  id: string;                 // UUID
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;         // ISO8601
}
```

**Verification Steps:**
- [ ] Response status is 201 Created
- [ ] All fields are present in response
- [ ] id is valid UUID
- [ ] created_at is ISO8601 timestamp
- [ ] Phone can be null

**Frontend Usage:**
```typescript
const res = await fetch('/api/clients', {
  method: 'POST',
  body: JSON.stringify({ email, full_name, phone })
});
const created: ClientCreateResponse = await res.json();
```

---

#### ✅ GET /api/clients (List)
**Expected Response Shape:**
```typescript
{
  module: "clients";           // literal string
  count: number;
  clients: Array<{
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    loyalty_points: number;     // NOT string
    membership_tier: "none" | "silver" | "gold" | "platinum";
    risk_score: number | null;
    created_at: string;         // ISO8601
  }>;
}
```

**Verification Steps:**
- [ ] Response is 200 OK
- [ ] count matches clients.length
- [ ] loyalty_points is number (not string)
- [ ] membership_tier is one of 4 enums
- [ ] risk_score can be null
- [ ] Pagination works with limit/offset params

**Frontend Usage:**
```typescript
const res = await fetch('/api/clients?limit=20&offset=0');
const data: ClientListResponse = await res.json();
// Guaranteed: data.clients.every(c => typeof c.loyalty_points === 'number')
```

---

#### ✅ GET /api/clients/:id (Profile)
**Expected Response Shape:**
```typescript
{
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  loyalty_points: number;           // NOT string
  membership_tier: "none" | "silver" | "gold" | "platinum";
  telehealth_consent: boolean;
  preferences: Record<string, unknown>;  // {} if none
  photo_url: string | null;
  balance_due: number;               // Total unpaid invoices in cents
  
  upcoming_bookings: Array<{
    id: string;
    start_time: string;              // ISO8601, future only
    end_time: string;
    status: string;
    room: string | null;
    service: { name: string };
    staff: {
      id: string | null;
      full_name: string | null;
      photo_url: string | null;
    };
  }>;
  
  booking_history: Array<{           // ALL past + future
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    room: string | null;
    service_name: string | null;
    staff_name: string | null;
  }>;
  
  invoices: Array<{
    id: string;
    amount_cents: number;            // NOT string
    status: string;
    due_date: string;                // YYYY-MM-DD
  }>;
}
```

**Critical Type Rules:**
| Field | Type | Notes |
|-------|------|-------|
| loyalty_points | number | MUST NOT be string |
| balance_due | number | Sum of unpaid invoices |
| upcoming_bookings | Array | Always present, may be [] |
| start_time | string ISO8601 | Filters to future only |
| amount_cents | number | MUST NOT be string |

**Verification Steps:**
- [ ] Response 200 OK
- [ ] balance_due is number
- [ ] upcoming_bookings filters on start_time >= now()
- [ ] booking_history includes all (past + future)
- [ ] invoices[].amount_cents is number
- [ ] staff.id and photo_url can be null
- [ ] 404 if client not found in org

**Frontend Usage:**
```typescript
// Safe type coercion
const response = await fetch(`/api/clients/${clientId}`);
const profile: ClientProfile = await response.json();

// These are guaranteed numbers
profile.loyalty_points;        // number
profile.balance_due;           // number
```

---

#### ✅ PUT /api/clients/:id (Update)
**Expected Response Shape:**
```typescript
{
  id: string;
  full_name: string;
  phone: string | null;
  membership_tier: string;
  preferences: Record<string, unknown>;
  updated_at: string;          // ISO8601
}
```

**Verification Steps:**
- [ ] Response 200 OK
- [ ] All submitted fields are in response
- [ ] updated_at matches current time (≈ now)
- [ ] 404 if client not found

---

#### ✅ GET /api/clients/:id/loyalty
**Expected Response Shape:**
```typescript
{
  points: number;              // NOT string
  tier: "none" | "silver" | "gold" | "platinum";
  redemption_history: Array<{
    id: string;
    type: "earn" | "redeem" | "adjust";
    points: number;            // Can be negative for redeems
    balance_after: number;     // NOT string
    description: string | null;
    created_at: string;        // ISO8601
  }>;
}
```

**Critical Type Rules:**
| Field | Type | Notes |
|-------|------|-------|
| points | number | Current points balance |
| balance_after | number | Balance after transaction |
| type | enum | exactly "earn" \| "redeem" \| "adjust" |

**Verification Steps:**
- [ ] points is number
- [ ] balance_after is number
- [ ] No string numbers
- [ ] Most recent transactions first (created_at DESC)
- [ ] 404 if client not found

---

#### ✅ POST /api/clients/:id/loyalty/redeem
**Expected Response Shape:**
```typescript
{
  redeemed: true;              // literal boolean true
  points: number;              // Points redeemed
  balance_after: number;       // New balance
}
```

**Response Status:** 202 Accepted (not 200!)

**Verification Steps:**
- [ ] Response 202 Accepted (crucial – not 200)
- [ ] redeemed is boolean true
- [ ] points & balance_after are numbers
- [ ] 400 if insufficient points
- [ ] 404 if client not found

---

### 2. Staff Endpoints

#### ✅ GET /api/staff (Roster)
**Expected Response Shape:**
```typescript
{
  module: "staff";
  count: number;
  staff: Array<{
    id: string;
    full_name: string;
    email: string;
    role: "therapist" | "receptionist" | "manager" | "admin";
    rating: number;            // Numeric 3,2 (e.g., 4.8)
    is_active: boolean;
    specializations: string[]; // [] if none
    created_at: string;        // ISO8601
  }>;
}
```

**Verification Steps:**
- [ ] rating is number (e.g., 4.8, not "4.8")
- [ ] specializations is always array (never null)
- [ ] is_active is boolean
- [ ] Ordered by full_name ASC

---

#### ✅ POST /api/staff (Invite)
**Expected Response Shape:**
```typescript
{
  id: string;
  full_name: string;
  email: string;
  role: string;
  invite_status: "queued";     // literal string "queued"
}
```

**Response Status:** 201 Created

**Verification Steps:**
- [ ] Response 201 Created
- [ ] invite_status is literal "queued"
- [ ] Email notification should be queued (BullMQ)

---

#### ✅ GET /api/staff/:id (Profile)
**Expected Response Shape:**
```typescript
{
  id: string;
  full_name: string;
  email: string;
  role: string;
  specializations: string[];
  availability: Record<string, unknown>;  // JSONB as-is
  rating: number;               // NOT string; e.g., 4.8
  photo_url: string | null;
  
  schedule: Array<{
    id: string;
    start_time: string;         // ISO8601
    status: string;
  }>;
  
  performance: {
    upcoming_bookings: number;  // Count of future appointments
  };
}
```

**Critical Type Rules:**
| Field | Type | Notes |
|-------|------|-------|
| rating | number | E.g., 4.5, not "4.5" |
| availability | JSONB | Raw object/array; may be {} |
| schedule | Array | Limited to 10 entries |

**Verification Steps:**
- [ ] rating is number
- [ ] availability is object (may be {})
- [ ] schedule[].start_time is ISO8601
- [ ] upcoming_bookings is integer >= 0
- [ ] 404 if staff not found

---

#### ✅ PUT /api/staff/:id/availability
**Expected Response Shape:**
```typescript
{
  updated: true;               // literal boolean true
  availability: Record<string, unknown>;
  updated_at: string;          // ISO8601
}
```

**Verification Steps:**
- [ ] updated is boolean true
- [ ] 404 if staff not found

---

#### ✅ GET /api/staff/:id/performance
**Expected Response Shape:**
```typescript
{
  bookings_completed: number;
  avg_session_rating: number;           // e.g., 4.8
  revenue_generated: number;            // cents
  no_show_contribution_pct: number;     // integer count (legacy naming)
  client_retention_rate: number;        // percentage 0-100
  top_services: string[];               // Up to 5
  availability_this_week: Record<string, unknown>;  // JSONB
}
```

**Critical Type Rules:**
| Field | Type | Notes |
|-------|------|-------|
| avg_session_rating | number | Staff member's rating |
| revenue_generated | number | In cents, not £GBP |
| no_show_contribution_pct | number | Actually a count (naming legacy issue) |
| client_retention_rate | number | Percentage 0-100, e.g., 78.5 |

**Verification Steps:**
- [ ] All numeric fields are numbers (not strings)
- [ ] top_services is array (may be [])
- [ ] retention_rate is 0-100
- [ ] 404 if staff not found

---

### 3. Analytics Endpoints

#### ✅ GET /api/analytics/business-summary
**Expected Response Shape:**
```typescript
{
  revenue: {
    today: number;              // cents
    this_week: number;
    this_month: number;
    vs_last_month_pct: number;  // e.g., 8.33
  };
  
  bookings: {
    today_total: number;        // integer
    no_show_rate_pct: number;   // e.g., 4.2
    cancellation_rate_pct: number;
    avg_booking_value: number;  // cents
  };
  
  staff: {
    utilisation_rate_pct: number;  // e.g., 81.5
    top_performer_id: string | null;
    understaffed_slots: number;
  };
  
  clients: {
    active_count: number;
    at_churn_risk: number;
    new_this_month: number;
    avg_lifetime_value: number;  // cents
  };
  
  ai_alerts: Array<{
    id: string;
    title: string;
    severity: "critical" | "high" | "medium" | "low";
    sourceModule: string;
    context: string;
    rank: number;
    score: number;              // 0-100
    reasoning: string[];
    followUpChain: string[];
    confidence: number;         // 0.0-1.0
  }>;
}
```

**CRITICAL TYPE RULES:**
| Field | Type | MUST NOT BE |
|-------|------|------------|
| today | number | string "1000" |
| vs_last_month_pct | number | string "8.33" |
| no_show_rate_pct | number | string "4.2" |
| utilisation_rate_pct | number | string "81.5" |
| avg_lifetime_value | number | string "9500" |

**Verification Steps:**
- [ ] Response 200 OK
- [ ] ALL numeric fields are `number` type (run typeof checks)
- [ ] ai_alerts is array (may be [])
- [ ] severity is one of 4 enums
- [ ] score is 0-100
- [ ] confidence is 0.0-1.0
- [ ] at_churn_risk is integer >= 0

**Frontend Type Guard:**
```typescript
const res = await fetch('/api/analytics/business-summary');
const data = await res.json();

// Verify critical types
console.assert(typeof data.revenue.today === 'number');
console.assert(typeof data.revenue.vs_last_month_pct === 'number');
console.assert(Array.isArray(data.ai_alerts));
```

---

#### ✅ GET /api/analytics/staff-performance/:id
**Expected Response Shape:** (Identical to `/api/staff/:id/performance`)

**Verification Steps:**
- [ ] Same shape as staff performance endpoint
- [ ] Provided for consistency; prefer `/api/staff/:id/performance` in code

---

#### ✅ POST /api/analytics/churn-prediction
**Expected Response Shape:**
```typescript
{
  at_risk_clients: Array<{
    id: string;
    name: string;
    days_since_visit: number;        // integer
    predicted_churn_pct: number;      // e.g., 72 (0-100)
    recommended_action: string;
  }>;
}
```

**Special Behavior:**
- Cache respects `lookback_days` parameter (default 90, range 30-180)
- Only returns clients with `predicted_churn_pct >= 50`
- Empty array `[]` is valid response (not 404)

**Verification Steps:**
- [ ] Response 200 OK (even if empty)
- [ ] All numeric fields are numbers
- [ ] days_since_visit is integer
- [ ] predicted_churn_pct is 0-100
- [ ] Respects lookback_days caching

---

## Type Definition Template (for frontend)

```typescript
// types/api.ts - Generated from Sprint A2 contracts

export interface ClientListResponse {
  module: "clients";
  count: number;
  clients: ClientSummary[];
}

export interface ClientSummary {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  loyalty_points: number;           // ← Not string
  membership_tier: "none" | "silver" | "gold" | "platinum";
  risk_score: number | null;
  created_at: string;
}

export interface ClientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  loyalty_points: number;           // ← Not string
  membership_tier: "none" | "silver" | "gold" | "platinum";
  telehealth_consent: boolean;
  preferences: Record<string, unknown>;
  photo_url: string | null;
  balance_due: number;              // ← Not string
  upcoming_bookings: ClientBooking[];
  booking_history: ClientHistoryEntry[];
  invoices: ClientInvoice[];
}

export interface ClientBooking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  room: string | null;
  service: { name: string };
  staff: {
    id: string | null;
    full_name: string | null;
    photo_url: string | null;
  };
}

export interface BusinessSummary {
  revenue: {
    today: number;                  // ← Not string
    this_week: number;
    this_month: number;
    vs_last_month_pct: number;
  };
  bookings: {
    today_total: number;
    no_show_rate_pct: number;
    cancellation_rate_pct: number;
    avg_booking_value: number;
  };
  staff: {
    utilisation_rate_pct: number;
    top_performer_id: string | null;
    understaffed_slots: number;
  };
  clients: {
    active_count: number;
    at_churn_risk: number;
    new_this_month: number;
    avg_lifetime_value: number;
  };
  ai_alerts: Array<ScoredAction>;
}

// ... (continue for all interfaces)
```

---

## Common Pitfalls to Avoid

❌ **WRONG:** Treating numbers as strings
```typescript
// ❌ This will fail
const points = response.loyalty_points;
if (points > 100) { ... }  // TypeScript error if string
```

✅ **RIGHT:** Trusting API contract
```typescript
// ✅ Numbers come from API as numbers
const points = response.loyalty_points;  // guaranteed number
if (points > 100) { ... }  // Works
```

---

❌ **WRONG:** Assuming arrays are always non-empty
```typescript
// ❌ May crash
const first = response.upcoming_bookings[0].id;
```

✅ **RIGHT:** Check length first
```typescript
// ✅ Safe
const upcoming = response.upcoming_bookings;
if (upcoming.length > 0) {
  // Process
}
```

---

❌ **WRONG:** Assuming optional fields exist
```typescript
// ❌ May be null
const photoUrl = response.staff.photo_url;
img.src = photoUrl;  // Displays "null" as string
```

✅ **RIGHT:** Check nullability
```typescript
// ✅ Safe
const photoUrl = response.staff.photo_url;
img.src = photoUrl ?? '/default-avatar.jpg';
```

---

## Sign-Off Response Template

When Agent B completes integration, provide this in AGENT_B_PHASE6_REPORT.md:

```markdown
## Sprint A2 Contract Verification ✅

**Agent B Confirms:**

✅ All 6 Client endpoints return correct type shapes
  - loyalty_points is number, not string
  - membership_tier enum validated
  - balance_due calculated correctly

✅ All 5 Staff endpoints return correct type shapes
  - rating is number (e.g., 4.8)
  - availability is JSONB object
  - specializations always array

✅ All 3 Analytics endpoints return correct type shapes
  - ALL monetary fields are numbers
  - Percentages are 0-100 floats
  - ai_alerts array present (may be empty)

✅ Frontend components integrated and tested:
  - ClientPortal consumes GET /api/clients/:id
  - BusinessAdminDashboard consumes GET /api/analytics/business-summary
  - StaffWorkspace consumes GET /api/staff/today-schedule
  - BookingFlow consumes GET /api/staff (service discovery)

✅ Type definitions created in frontend/src/types/api.ts
✅ npm run build passes (0 errors)
✅ Payment flow integration complete from Sprint A1

Frontend is ready for user acceptance testing.
```

---

*Prepared by Agent A for Agent B's verification process*
