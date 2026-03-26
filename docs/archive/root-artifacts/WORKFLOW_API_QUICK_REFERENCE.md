# Workflow API Quick Reference

## Base URL
```
http://localhost:3000/api/workflows
```

## All Endpoints at a Glance

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/subscriptions/:id` | Get current subscription state |
| `POST` | `/subscriptions/:id/initialize` | Start new workflow (pending_payment) |
| `POST` | `/subscriptions/:id/activate` | Activate subscription (pending_payment → active) |
| `POST` | `/subscriptions/:id/pause` | Pause subscription (active → paused) |
| `POST` | `/subscriptions/:id/resume` | Resume subscription (paused → active) |
| `POST` | `/subscriptions/:id/renew` | Trigger renewal (active → renewal_pending) |
| `POST` | `/subscriptions/:id/renew/complete` | Complete renewal (renewal_pending → active) |
| `POST` | `/subscriptions/:id/dunning` | Enter dunning (payment failure handling) |
| `POST` | `/subscriptions/:id/cancel` | Cancel subscription (any → cancelled) |
| `GET` | `/subscriptions/:id/history` | Get state transition audit trail |
| `POST` | `/subscriptions/:id/validate-transition` | Check if transition is allowed |

## Quick Examples

### Initialize a Subscription
```bash
curl -X POST http://localhost:3000/api/workflows/subscriptions/sub_abc123/initialize \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"New subscription"}'
```

### Activate After Payment
```bash
curl -X POST http://localhost:3000/api/workflows/subscriptions/sub_abc123/activate \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Payment completed"}'
```

### Get Current State
```bash
curl -X GET http://localhost:3000/api/workflows/subscriptions/sub_abc123 \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### Get History (Last 10 transitions)
```bash
curl -X GET "http://localhost:3000/api/workflows/subscriptions/sub_abc123/history?limit=10" \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

### Validate Transition
```bash
curl -X POST http://localhost:3000/api/workflows/subscriptions/sub_abc123/validate-transition \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromState":"active","toState":"paused"}'
```

## Response Format

### Success (200 OK)
```json
{
  "status": "success",
  "code": "OPERATION_CODE",
  "message": "Human readable message",
  "data": { /* operation-specific data */ }
}
```

### Error (4xx/5xx)
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "What went wrong",
  "data": { "subscriptionId": "sub_123" }
}
```

## State Machine Diagram

```
              ┌─────────────────────┐
              │  pending_payment    │
              └──────────┬──────────┘
                         │ activate (payment received)
                         ▼
    ┌─────────────────────────────────────────┐
    │            active ◄───┐                 │
    │                       │                 │
    │ renew    pause    reset payments       cancel
    │   │        │          │                 │
    │   ▼        ▼          │                 ▼
    │renewal_  paused   dunning (≤3)      cancelled
    │pending       │      retries            (terminal)
    │   │          │        │
    │   └──────────┘ auto-  │
    │        │        cancel│
    │        │        max───┘
    │        │    attempts
    │   renew/                │
    │  complete               ▼
    │        │             cancelled
    │        └─────────────────┘
    └────────────────────────────┘
```

## Common State Transitions

### Happy Path (Subscription Lifecycle)
```
pending_payment → activate → active → renew → renewal_pending → renew/complete → active
```

### Pause & Resume
```
active → pause → paused → resume → active
```

### Payment Failure Flow
```
active → dunning (attempt 1) → active (retry payment)
      → dunning (attempt 2) → active (retry payment)
      → dunning (attempt 3) → cancelled (auto-cancel)
```

### Cancellation
```
<any state> → cancel → cancelled (terminal)
```

## Key Fields in Subscription Response

| Field | Type | Description |
|-------|------|-------------|
| `subscriptionId` | string | Unique subscription identifier |
| `currentState` | string | One of: pending_payment, active, paused, renewal_pending, dunning, cancelled, expired |
| `billingCycleStart` | ISO8601 | Start of current billing period |
| `billingCycleEnd` | ISO8601 | End of current billing period |
| `autoRenew` | boolean | Whether subscription auto-renews |
| `failedPaymentAttempts` | number | Number of failed payment attempts (0-3) |
| `createdAt` | ISO8601 | When subscription was created |
| `updatedAt` | ISO8601 | When subscription was last updated |

## Error Codes

| Code | Status | Fix |
|------|--------|-----|
| `SUBSCRIPTION_NOT_FOUND` | 404 | Check subscription ID |
| `TRANSITION_FAILED` | 400 | State transition not allowed - check current state |
| `INVALID_AUTH` | 401 | Provide valid Clerk bearer token |
| `DUNNING_FAILED` | 400 | Auto-cancellation triggered after 3 attempts |

## Testing Locally

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Create Test Subscription
```sql
INSERT INTO subscriptions 
(id, organization_id, client_id, service_id, payment_method_id, created_at, updated_at)
VALUES 
('sub_test_123', 'org_test_123', 'client_123', 'service_123', 'pm_123', NOW(), NOW());
```

### 3. Get Bearer Token
Grab a Clerk test token from your `.env` or create one via Clerk dashboard.

### 4. Test Workflow
```bash
# Initialize
curl -X POST http://localhost:3000/api/workflows/subscriptions/sub_test_123/initialize \
  -H "Authorization: Bearer sk_test_xxxx" \
  -H "Content-Type: application/json" \
  -d '{}'

# Activate
curl -X POST http://localhost:3000/api/workflows/subscriptions/sub_test_123/activate \
  -H "Authorization: Bearer sk_test_xxxx" \
  -H "Content-Type: application/json" \
  -d '{}'

# Check state
curl -X GET http://localhost:3000/api/workflows/subscriptions/sub_test_123 \
  -H "Authorization: Bearer sk_test_xxxx"
```

## Building Integration

### From Frontend (React)
```typescript
// Call activate endpoint
const response = await fetch(
  `${API_BASE_URL}/api/workflows/subscriptions/${subscriptionId}/activate`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${clerkToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: 'Payment completed' })
  }
);

const data = await response.json();
if (data.status === 'success') {
  console.log('Subscription activated:', data.data.currentState);
}
```

### From Backend (Express/Node)
```typescript
// Call an endpoint from another module
const response = await fetch(
  `http://localhost:3000/api/workflows/subscriptions/${subscriptionId}/cancel`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${systemToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason: 'Automatic cleanup' })
  }
);
```

## Debugging Tips

### See Transition History
```bash
curl -X GET "http://localhost:3000/api/workflows/subscriptions/sub_abc/history" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Validate State Before Transition
```bash
curl -X POST http://localhost:3000/api/workflows/subscriptions/sub_abc/validate-transition \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromState":"active","toState":"cancelled"}'
```

### Check Database Directly
```sql
-- Current state
SELECT id, current_state, updated_at FROM subscriptions WHERE id = 'sub_abc';

-- Transition history
SELECT * FROM workflow_transitions 
WHERE entity_id = 'sub_abc' 
ORDER BY created_at DESC LIMIT 10;
```

## Related Files
- API Routes: `backend/src/workflows/routes.ts`
- State Machine: `backend/src/workflows/SubscriptionWorkflow.ts`
- Engine: `backend/src/workflows/WorkflowEngine.ts`
- Tests: `backend/src/test/workflow.test.ts`
- App Config: `backend/src/app.ts` (line 219: route mounting)

---

**Keep this handy when integrating workflows into your modules!**
