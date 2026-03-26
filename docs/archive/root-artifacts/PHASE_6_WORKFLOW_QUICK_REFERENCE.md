# Phase 6: Workflow Engine - Quick Reference

## 🎯 What Was Built

A complete **Dynamic Workflow Engine** for managing subscription lifecycle with automatic state management, dunning logic, and multi-module integration.

## 📦 Core Components

### 1. WorkflowEngine (Foundation)
- Generic state machine for any entity type
- Persistent transitions to database
- Audit trail with metadata
- Multi-tenant support

### 2. SubscriptionWorkflow (Business Logic)
- Complete subscription lifecycle
- 6 valid states: pending_payment, active, paused, renewal_pending, dunning, cancelled
- Automatic billing cycle management
- 3-attempt dunning with auto-cancellation

### 3. REST API (routes.ts)
```javascript
POST   /api/workflows/subscriptions/:id/initialize
POST   /api/workflows/subscriptions/:id/activate
POST   /api/workflows/subscriptions/:id/pause
POST   /api/workflows/subscriptions/:id/resume
POST   /api/workflows/subscriptions/:id/renew
POST   /api/workflows/subscriptions/:id/renew/complete
POST   /api/workflows/subscriptions/:id/dunning
POST   /api/workflows/subscriptions/:id/cancel
GET    /api/workflows/subscriptions/:id
GET    /api/workflows/subscriptions/:id/history
POST   /api/workflows/subscriptions/:id/validate-transition
```

### 4. Event Handlers (Integration)
- Payment success/failure → state transitions
- Subscription expiry → automatic renewal
- Invoice paid → renewal completion
- Refund processing → proration handling

## 🚀 Quick Start

### Initialize a Subscription
```bash
curl -X POST http://localhost:3000/api/workflows/subscriptions/sub_123/initialize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "New customer signup"}'
```

### Activate After Payment
```bash
curl -X POST http://localhost:3000/api/workflows/subscriptions/sub_123/activate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Payment completed"}'
```

### Get Current State
```bash
curl http://localhost:3000/api/workflows/subscriptions/sub_123 \
  -H "Authorization: Bearer $TOKEN"
```

### View Transition History
```bash
curl "http://localhost:3000/api/workflows/subscriptions/sub_123/history?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 State Diagram

```
pending_payment ──(payment)──> active ──(expiry)──> renewal_pending
                                  │
                          (pause)  └──> paused (resume)──> active
                                  │
                          (failure)──> dunning ──(retry)──> renewal
                                  │
                                  └──(cancel)──> cancelled (final)
```

## 🔄 Event Integration

### Payment Module → Workflow
- ✅ Payment success handler
- ✅ Payment failure handler
- ✅ Automatic retry on dunning

### Workflow → Notifications
- ✅ Send activation confirmation
- ✅ Send renewal reminders (7 days before)
- ✅ Send payment failure alerts
- ✅ Send cancellation confirmation

### Finance Module Integration
- ✅ Invoice tracking for renewals
- ✅ Revenue recognition
- ✅ Refund processing

## 📝 Running Tests

```bash
cd backend
npm run test -- workflow.test.ts
```

Expected: 15+ test cases passing

## 🛠️ Development

### Add a New State (Example: "suspended")

1. Update `SubscriptionState` type:
```typescript
export type SubscriptionState = 
  | "pending_payment"
  | "active"
  | "suspended"  // ← NEW
  | "cancelled";
```

2. Add transition rules:
```typescript
// In validateTransition()
const validTransitions: Record<SubscriptionState, SubscriptionState[]> = {
  "suspended": ["active", "cancelled"],  // ← NEW
  // existing...
};
```

3. Create handler:
```typescript
async suspendSubscription(payload: SubscriptionTransitionPayload): Promise<TransitionResult> {
  return await this.workflowEngine.transitionState({
    organizationId: payload.organizationId,
    entityType: "subscription",
    entityId: payload.subscriptionId,
    toState: "suspended",
    triggeredBy: payload.userId || "system",
    reason: payload.reason,
    metadata: { initiator: "subscription.suspend" }
  });
}
```

4. Add route:
```typescript
workflowRoutes.post("/subscriptions/:id/suspend", requireAuth, async (req, res, next) => {
  try {
    const result = await subscriptionWorkflow.suspendSubscription({
      organizationId: res.locals.auth.organizationId,
      subscriptionId: req.params.id,
      userId: res.locals.auth.userId,
      reason: req.body.reason
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    next(err);
  }
});
```

## 🧪 Testing a Workflow

```bash
# Run backend in dev mode
npm run dev

# In another terminal, run tests
npm run test:watch

# Or curl to test manually
TOKEN="your_clerk_token"
ORG_ID="org_123"
SUB_ID="sub_456"

# Create subscription
curl -X POST http://localhost:3000/api/workflows/subscriptions/$SUB_ID/initialize \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "Manual test"}'

# Activate it
curl -X POST http://localhost:3000/api/workflows/subscriptions/$SUB_ID/activate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"reason": "Payment received"}'

# Check state
curl http://localhost:3000/api/workflows/subscriptions/$SUB_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Monitoring

### Key Metrics
- Workflow route error rate (should be <1%)
- P95 transition latency (should be <100ms)
- Dunning rate (should be <5%)
- Renewal success rate (should be >95%)

### Logs to Watch
```bash
# See workflow transitions
grep "subscription\." /var/log/backend.log

# See failures
grep -E "WARN|ERROR" /var/log/backend.log | grep workflow
```

## 🚨 Troubleshooting

### "Cannot transition from X to Y"
- Check current state with: `GET /api/workflows/subscriptions/:id`
- Review valid transitions in `SubscriptionWorkflow.validateTransition()`

### "Subscription not found"
- Verify subscription was created: `SELECT * FROM subscriptions WHERE id = ?`
- Check organization_id matches token

### "Payment failed but subscription still active"
- Event handler may not have fired
- Check notifications queue: `SELECT * FROM jobs WHERE name = 'notification'`
- Manually trigger: `POST /api/workflows/subscriptions/:id/dunning`

## 📚 Database Schema

### workflow_states
```sql
- id (UUID)
- organization_id (TEXT) - multi-tenant
- entity_type (TEXT) - 'subscription'
- entity_id (TEXT) - reference to entity
- current_state (TEXT) - current state name
- created_at, updated_at
```

### workflow_transitions (audit trail)
```sql
- id (UUID)
- organization_id (TEXT)
- entity_type, entity_id
- from_state, to_state
- triggered_by (user_id or 'system')
- reason (TEXT)
- metadata (JSONB)
- created_at
```

## ✅ Deployment Checklist

- [ ] Run `npm run db:migrate` (applies workflow tables)
- [ ] Run `npm run test` (all passing)
- [ ] Check `npm run typecheck` (no errors)
- [ ] Verify Redis connection
- [ ] Test payment webhook flow
- [ ] Monitor workflow_transitions growth
- [ ] Set up alerts for dunning spike
- [ ] Document manual dunning recovery procedure

## 🔗 Related Documentation

- [Payment Integration](../modules/payments/)
- [Notifications System](../modules/notifications/)
- [Finance Module](../modules/finance/)
- [Architecture Overview](../../ARCHITECTURE.md)

## 📞 Support

For issues:
1. Check logs: `npm run logs`
2. Run tests: `npm run test`
3. Review history: `GET /api/workflows/subscriptions/:id/history`
4. Check database: `SELECT * FROM workflow_transitions WHERE entity_id = ?`

---

**Phase 6 Delivery Date**: March 2026
**Status**: ✅ Production Ready
**Maintainer**: Platform Team
