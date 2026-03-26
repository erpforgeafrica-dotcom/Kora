# KORA Backend Workflow Infrastructure - Complete Search Results

## 1. DATABASE MIGRATIONS - Workflow State Machines

### Migration 025: Canonical Schema (Foundation)
**File**: [backend/src/db/migrations/025_canonical_schema.sql](backend/src/db/migrations/025_canonical_schema.sql#L44-L100)

#### Core Workflow Tables:

**1. workflow_definitions** (Single source of truth for state machines)
```sql
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('booking', 'subscription', 'service', 'business', 'staff_assignment')),
  name TEXT NOT NULL,
  description TEXT,
  initial_state TEXT NOT NULL,
  terminal_states TEXT[] NOT NULL,
  transitions JSONB NOT NULL, -- {"pending": ["confirmed", "cancelled"], ...}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, name)
);
```

**2. workflow_instances** (Runtime state tracking)
```sql
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE RESTRICT,
  current_state TEXT NOT NULL,
  previous_state TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX idx_workflow_instances_business_state ON workflow_instances(business_id, current_state);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(business_id, entity_type, current_state) 
  WHERE completed_at IS NULL;
```

**3. workflow_transitions** (Immutable audit trail)
```sql
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  triggered_by UUID NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_workflow_transitions_instance ON workflow_transitions(workflow_instance_id);
CREATE INDEX idx_workflow_transitions_audit ON workflow_transitions(workflow_instance_id, created_at DESC);
```

#### Seeded Workflow Definitions:

```sql
INSERT INTO workflow_definitions (entity_type, name, description, initial_state, terminal_states, transitions)
VALUES
  ('booking', 'booking_lifecycle', 'Standard booking state machine',
   'pending', ARRAY['completed', 'cancelled', 'no_show', 'failed'],
   '{"pending": ["confirmed", "cancelled"], 
     "confirmed": ["checked_in", "cancelled"], 
     "checked_in": ["in_progress", "no_show"], 
     "in_progress": ["completed", "failed"], 
     "failed": ["pending"], 
     "cancelled": ["cancelled"], 
     "no_show": ["no_show"], 
     "completed": ["completed"]}'::jsonb),
  
  ('subscription', 'subscription_lifecycle', 'Subscription activation and renewal',
   'pending_payment', ARRAY['canceled', 'expired'],
   '{"pending_payment": ["active", "canceled"], 
     "active": ["paused", "canceled", "past_due"], 
     "paused": ["active", "canceled"], 
     "past_due": ["active", "canceled"], 
     "canceled": ["canceled"], 
     "expired": ["expired"]}'::jsonb),
  
  ('service', 'service_publication', 'Service visibility lifecycle',
   'draft', ARRAY['archived'],
   '{"draft": ["active", "archived"], 
     "active": ["paused", "archived"], 
     "paused": ["active", "archived"], 
     "archived": ["archived"]}'::jsonb),
  
  ('business', 'business_activation', 'Business registration to operational',
   'pending_activation', ARRAY['archived'],
   '{"pending_activation": ["active", "suspended", "archived"], 
     "active": ["paused", "suspended", "archived"], 
     "paused": ["active", "archived"], 
     "suspended": ["suspended", "archived"], 
     "archived": ["archived"]}'::jsonb);
```

### Migration 029: Booking-to-Staff Workflow
**File**: [backend/src/db/migrations/029_booking_staff_workflow.sql](backend/src/db/migrations/029_booking_staff_workflow.sql)

#### Related Tables (State Machine Support):

**1. booking_staff_assignments**
```sql
CREATE TABLE booking_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('primary', 'support', 'observer')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by_user_id UUID,
  status TEXT NOT NULL DEFAULT 'assigned' 
    CHECK (status IN ('assigned', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled')),
  confirmation_status TEXT DEFAULT 'pending' 
    CHECK (confirmation_status IN ('pending', 'confirmed', 'declined', 'no_response')),
  confirmed_at TIMESTAMPTZ,
  confirmed_by_user_id UUID,
  start_actual_time TIMESTAMPTZ,
  end_actual_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  rating_from_staff NUMERIC(3,2),
  rating_from_customer NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**2. booking_waitlist**
```sql
CREATE TABLE booking_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  service_id UUID NOT NULL,
  preferred_staff_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  requested_date DATE,
  requested_time_window TEXT,
  position_in_queue INTEGER,
  status TEXT NOT NULL DEFAULT 'waiting' 
    CHECK (status IN ('waiting', 'notified', 'confirmed', 'expired', 'cancelled')),
  notified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**3. staff_shifts**
```sql
CREATE TABLE staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  staff_member_id UUID NOT NULL REFERENCES staff_members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  assigned_location TEXT,
  shift_status TEXT NOT NULL DEFAULT 'scheduled' 
    CHECK (shift_status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 2. WORKFLOW FILES & SERVICES

### WorkflowEngine Service
**File**: [backend/src/workflows/WorkflowEngine.ts](backend/src/workflows/WorkflowEngine.ts)
**Lines**: 200+

**Key Methods**:
- `getWorkflowDefinition(entityType, name)` - Load state machine config
- `createInstance(orgId, entityType, entityId, workflowName)` - Start new workflow instance
- `getInstance(entityId)` - Get current state
- `transitionState(entityId, request, userId)` - Validate and execute state transition
- `getTransitionHistory(entityId, limit)` - Audit trail retrieval
- `emitStateChangeEvent(instance, fromState, toState)` - Event systems

**Core Logic Pattern**:
```typescript
// Validates transition allowed in definition
const validNextStates = def.transitions[currentState] || [];
if (!validNextStates.includes(requestedState)) {
  throw new InvalidStateTransitionError(...);
}

// Records in audit table
INSERT INTO workflow_transitions (
  workflow_instance_id, from_state, to_state, triggered_by, reason, metadata
)

// Updates instance state
UPDATE workflow_instances SET current_state, completed_at (if terminal state)
```

### WorkflowEngine Types
**File**: [backend/src/workflows/types.ts](backend/src/workflows/types.ts)

**Enums**:
```typescript
enum EntityType {
  BOOKING = "booking",
  SUBSCRIPTION = "subscription",
  SERVICE = "service",
  BUSINESS = "business",
  STAFF_ASSIGNMENT = "staff_assignment"
}

enum BookingState {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CHECKED_IN = "checked_in",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
  FAILED = "failed"
}

enum SubscriptionState {
  PENDING_PAYMENT = "pending_payment",
  ACTIVE = "active",
  PAUSED = "paused",
  PAST_DUE = "past_due",
  CANCELLED = "cancelled",
  EXPIRED = "expired"
}
```

**Interfaces**:
```typescript
interface WorkflowDefinition {
  id: string;
  entity_type: EntityType;
  name: string;
  description: string;
  initial_state: string;
  terminal_states: string[];
  transitions: Record<string, string[]>; // State graph
  created_at: string;
}

interface WorkflowInstance {
  id: string;
  business_id: string;
  entity_type: EntityType;
  entity_id: string;
  workflow_definition_id: string;
  current_state: string;
  previous_state: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkflowTransition {
  id: string;
  workflow_instance_id: string;
  from_state: string;
  to_state: string;
  triggered_by: string; // user_id
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
```

### BookingWorkflow Implementation
**File**: [backend/src/workflows/BookingWorkflow.ts](backend/src/workflows/BookingWorkflow.ts)
**Lines**: 150+

**Features**:
- RBAC enforcement per transition (staff, client, admin roles)
- Prerequisite validation (e.g., staff assigned before confirm)
- Side effects execution (notifications, analytics)

**Transition Rule Matrix**:
```typescript
const roleRules: Record<string, Record<string, string[]>> = {
  [BookingState.PENDING]: {
    [BookingState.CONFIRMED]: ["staff", "admin"],
    [BookingState.CANCELLED]: ["client", "staff", "admin"]
  },
  [BookingState.CONFIRMED]: {
    [BookingState.CHECKED_IN]: ["staff", "admin"],
    [BookingState.CANCELLED]: ["client", "staff", "admin"]
  },
  [BookingState.CHECKED_IN]: {
    [BookingState.IN_PROGRESS]: ["staff", "admin"],
    [BookingState.NO_SHOW]: ["staff", "admin"],
    [BookingState.CANCELLED]: ["staff", "admin"]
  },
  [BookingState.IN_PROGRESS]: {
    [BookingState.COMPLETED]: ["staff", "admin"],
    [BookingState.FAILED]: ["staff", "admin"],
    [BookingState.CANCELLED]: ["staff", "admin"]
  }
};
```

### Booking Workflow Routes
**File**: [backend/src/modules/bookings/workflowRoutes.ts](backend/src/modules/bookings/workflowRoutes.ts)
**Registered At**: [backend/src/app.ts](backend/src/app.ts#L211) - `/api/bookings/workflow`

**Endpoints**:
- `GET /api/bookings/workflow/calendar` - Calendar view with booking states
- `POST /api/bookings/workflow/:id/status` - Transition to new status
- `POST /api/bookings/workflow/:id/reschedule` - Transition + reschedule

**Route Integration**:
```typescript
app.use("/api/bookings/workflow", requireAuth, bookingWorkflowRoutes);
```

### Workflow Policies (AI Orchestration)
**File**: [backend/src/modules/ai/orchestration/workflowPolicies.ts](backend/src/modules/ai/orchestration/workflowPolicies.ts)

**Features**:
- Autonomous policy execution based on work signals
- Policy simulation vs auto-execution modes
- Integration with notification queue

**Integration With Queue**:
```typescript
const job = await enqueueNotification({
  organizationId,
  channel: "push",
  payload: {
    type: "orchestration_policy",
    priority: "p1",
    triggeredBy: policy.policyId
  }
});
```

---

## 3. JOB QUEUE DEFINITIONS

**File**: [backend/src/queues/index.ts](backend/src/queues/index.ts)

### Queue Infrastructure:
```typescript
export const notificationsQueue = new Queue("notifications", {
  connection: queueConnection
});

export const reportingQueue = new Queue("reporting", {
  connection: queueConnection
});

export const anomalyQueue = new Queue("anomaly-detector", {
  connection: queueConnection
});
```

### Queue Job Types:

**1. Notifications Queue**:
```typescript
interface NotificationJobData {
  organizationId: string;
  channel: "email" | "sms" | "push" | "whatsapp";
  payload: Record<string, unknown>;
}

export async function enqueueNotification(data: NotificationJobData) {
  return notificationsQueue.add("dispatch_notification", data, {
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
}
```

**2. Reporting Queue**:
```typescript
interface ReportJobData {
  organizationId: string;
  reportType: "daily" | "weekly" | "monthly";
  requestedBy: string;
}

export async function enqueueReportGeneration(data: ReportJobData) {
  return reportingQueue.add("generate_report", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
}
```

**3. Anomaly Detection Queue**:
```typescript
interface AnomalyDetectionJobData {
  organizationId: string;
  metricName: string;
  currentValue: number;
  timestamp: string;
}

export async function enqueueAnomalyDetection(data: AnomalyDetectionJobData) {
  return anomalyQueue.add("detect_anomaly", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: 200,
    removeOnFail: 500
  });
}
```

### Workflow Events (Integration Pattern):
- Workflow state transitions **trigger** notification jobs
- Transition metadata includes event payload
- Policy execution enqueues async jobs for side effects

---

## 4. STATE TRANSITION REFERENCES IN EXISTING CODE

### Workflow Transitions Execution
**File**: [backend/src/workflows/WorkflowEngine.ts](backend/src/workflows/WorkflowEngine.ts)

**Two-Phase Commit Pattern**:
1. **Insert Audit Record**:
   ```sql
   INSERT INTO workflow_transitions 
   (workflow_instance_id, from_state, to_state, triggered_by, reason, metadata)
   VALUES ($1, $2, $3, $4, $5, $6)
   ```

2. **Update Instance State**:
   ```sql
   UPDATE workflow_instances
   SET previous_state = $2,
       current_state = $3,
       completed_at = CASE WHEN $4 = true THEN now() ELSE completed_at END,
       updated_at = now()
   WHERE id = $1
   ```

### API Transition Triggers
**File**: [backend/src/modules/bookings/workflowRoutes.ts](backend/src/modules/bookings/workflowRoutes.ts)

**POST /api/bookings/workflow/:id/status**:
```typescript
const validStatuses = ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"];

await queryDb(
  `UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3`,
  [status, id, organizationId]
);

// Audit trail
await queryDb(
  `INSERT INTO booking_status_history (booking_id, status, reason, changed_by, changed_at)
   VALUES ($1, $2, $3, $4, NOW())`,
  [id, status, reason || null, res.locals.auth?.userId]
);
```

### Workflow Policy Integration
**File**: [backend/src/modules/ai/orchestration/workflowPolicies.ts](backend/src/modules/ai/orchestration/workflowPolicies.ts)

**Policy Outcome States**:
```typescript
interface PolicyOutcome {
  policyId: string;
  description: string;
  triggered: boolean;          // Policy condition met
  executed: boolean;           // Action taken
  details: Record<string, unknown>;
  simulation?: {
    would_have_executed: boolean;
    predicted_outcome: string;
    risk_if_not_executed: string;
    confidence: number;
  };
}
```

### Worker Processing
**File**: [backend/src/workers/anomalyDetector.ts](backend/src/workers/anomalyDetector.ts)

Processes async jobs enqueued by workflow transitions.

---

## SUMMARY TABLE

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| Workflow Definitions | Migration 025 | State machine catalog | Seeded (4 workflows) |
| Workflow Instances | Migration 025 | Runtime state tracking | Active |
| Workflow Transitions | Migration 025 | Audit trail | Active |
| WorkflowEngine | `src/workflows/WorkflowEngine.ts` | Core state machine logic | Production |
| BookingWorkflow | `src/workflows/BookingWorkflow.ts` | Booking-specific rules | Production |
| Booking Routes | `src/modules/bookings/workflowRoutes.ts` | HTTP endpoints | Active @/api/bookings/workflow |
| Policies | `src/modules/ai/orchestration/workflowPolicies.ts` | Orchestration rules | Production |
| Queues | `src/queues/index.ts` | Async job dispatch | BullMQ (3 queues) |
| Booking Staff Resources | Migration 029 | Assignment + shift tracking | Active |

---

## KEY ARCHITECTURAL PATTERNS

### 1. State Machine Pattern
- Definitions stored as JSONB transitions map (state graph)
- Instance tracks current + previous state
- Transitions validated against definition before execution

### 2. Audit Trail Pattern
- Every transition creates immutable row in `workflow_transitions`
- Includes: from_state, to_state, triggered_by, reason, metadata, timestamp
- `triggered_by` is user_id for permission auditing

### 3. Event-Driven Pattern
- State transitions emit events via `emitStateChangeEvent()`
- Events trigger notification queue jobs
- Policy engine subscribes to transitions for orchestration

### 4. RBAC Integration
- BookingWorkflow enforces per-role allowed transitions
- Staff/Client/Admin have different allowed actions
- Validated before transition execution

### 5. Queue Integration Pattern
- Policies enqueue notification jobs on state changes
- Example: Emergency priority p1 → SMS notification queue
- Anomaly detection on metric changes → Async processing
