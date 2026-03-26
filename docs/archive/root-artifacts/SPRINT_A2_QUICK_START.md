# Sprint A2 Quick Start Guide
## Booking Engine & Audience APIs

### New Endpoints Summary

#### Client API (6 endpoints)
```
GET    /api/clients                    - List all clients (paginated)
POST   /api/clients                    - Create new client
GET    /api/clients/:id                - Full client profile
PUT    /api/clients/:id                - Update preferences
GET    /api/clients/:id/loyalty        - View loyalty points & history
POST   /api/clients/:id/loyalty/redeem - Redeem points for discount
```

#### Staff API (5 endpoints)
```
GET    /api/staff                      - List team roster
POST   /api/staff                      - Invite staff member
GET    /api/staff/:id                  - Staff profile + metrics
GET    /api/staff/:id/performance      - Performance KPIs
PUT    /api/staff/:id/availability     - Update availability blocks
```

**Special Endpoints (Auth-scoped):**
```
GET    /api/staff/today-schedule       - Today's appointments (for logged-in staff)
GET    /api/staff/client-brief/:id     - AI client brief (for upcoming appointment)
POST   /api/staff/appointments/:id/status - Update appointment status
```

#### Analytics API (3 endpoints)
```
GET    /api/analytics/business-summary          - Dashboard KPIs
GET    /api/analytics/staff-performance/:id     - Individual performance
POST   /api/analytics/churn-prediction          - AI churn risk scoring
```

---

### Testing the APIs

#### 1. Create a Test Client
```bash
curl -X POST http://localhost:3001/api/clients \
  -H "Authorization: Bearer <clerk-token>" \
  -H "x-org-id: <org-uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test Client",
    "phone": "+23480000000"
  }'
```

#### 2. Retrieve Client Profile
```bash
curl http://localhost:3001/api/clients/<client-id> \
  -H "Authorization: Bearer <clerk-token>" \
  -H "x-org-id: <org-uuid>"
```

#### 3. View Business Summary
```bash
curl http://localhost:3001/api/analytics/business-summary \
  -H "Authorization: Bearer <clerk-token>" \
  -H "x-org-id: <org-uuid>"
```

#### 4. Redeem Loyalty Points
```bash
curl -X POST http://localhost:3001/api/clients/<client-id>/loyalty/redeem \
  -H "Authorization: Bearer <clerk-token>" \
  -H "x-org-id: <org-uuid>" \
  -H "Content-Type: application/json" \
  -d '{
    "points": 100,
    "description": "£5 discount",
    "discount_amount_cents": 500
  }'
```

---

### Frontend Integration Points

#### ClientPortal Components
The following pages/components depend on Sprint A2 endpoints:

```typescript
// Profile & Booking History
GET /api/clients/:id
→ Used by: ClientPortal.tsx, ClientProfile.tsx

// Loyalty Widget
GET /api/clients/:id/loyalty
→ Used by: LoyaltyWidget.tsx, BalancesTab.tsx

// Redeem Points
POST /api/clients/:id/loyalty/redeem
→ Used by: LoyaltyPanel.tsx

// Staff Selection (Booking)
GET /api/staff
→ Used by: BookingFlow.tsx, StaffSelector.tsx

// Staff Availability
GET /api/staff/:id/performance
→ Used by: AvailabilitySlots.tsx
```

#### Business Admin Dashboard
```typescript
GET /api/analytics/business-summary
→ Used by: BusinessAdminDashboard.tsx
→ Components: KPICards, RevenueChart, ChurnRiskPanel

GET /api/analytics/staff-performance/:id
→ Used by: StaffPerformanceDrawer.tsx
```

#### Staff Workspace
```typescript
GET /api/staff/today-schedule
→ Used by: StaffWorkspace.tsx, TimelineView.tsx

GET /api/staff/client-brief/:appointmentId
→ Used by: ClientBriefPanel.tsx
```

---

### Common Request/Response Patterns

#### Authorization Header
All endpoints require Clerk JWT token:
```
Authorization: Bearer eyJhbGc...
```

#### Organization Scope
Endpoints are org-scoped. Provide via header OR JWT claims:
```
x-org-id: 00000000-0000-0000-0000-000000000001
```
(Preferred: Let Clerk JWT provide this; header overrides)

#### Numeric Types
All monetary/count fields are JavaScript `number` (not strings):
```typescript
{
  loyalty_points: 240,           // number
  amount_cents: 5500,            // number
  rating: 4.8,                   // number
  vs_last_month_pct: 8.33       // number
}
```

#### Error Response Format
```json
{
  "error": "client_not_found",
  "status": 404
}
```

Common error codes:
- `missing_organization_id` (400)
- `missing_required_client_fields` (400)
- `insufficient_loyalty_points` (400)
- `client_not_found` (404)
- `staff_not_found` (404)

---

### Data Flow Diagram

```
┌─────────────────────┐
│   React Frontend    │
└──────────┬──────────┘
           │
    POST /api/clients
    GET  /api/clients/:id
    GET  /api/staff
    POST /api/staff/appointments/:id/status
           │
           ▼
┌─────────────────────────────────────┐
│   Express Backend (14 endpoints)    │
├─────────────────────────────────────┤
│ • Clerk Auth Validation             │
│ • Org Scoping (x-org-id header)     │
│ • Audit Logging (all mutations)     │
│ • Notification Queueing (BullMQ)    │
│ • AI Integration (Claude)           │
│ • Redis Caching (4h/24h TTL)        │
└──────────┬──────────────────────────┘
           │
    SQL Queries
    Notification Events
    AI Task Execution
           │
           ▼
┌──────────────────────┐
│   PostgreSQL + Redis │
│   BullMQ + Claude    │
└──────────────────────┘
```

---

### Performance Considerations

#### Query Optimization
- `GET /api/clients` uses pagination (default 20, max 50)
- `GET /api/analytics/business-summary` runs 5 heavy queries in parallel
- `POST /api/analytics/churn-prediction` uses 4h Redis cache (fetch once per org+lookback_days)
- `GET /api/staff/client-brief/:id` uses 24h Redis cache per appointment

#### Typical Response Times
- `GET /api/clients/:id` → 50-150ms (3 parallel queries + join)
- `GET /api/analytics/business-summary` → 200-500ms (5 queries, cache miss)
- `GET /api/analytics/business-summary` → 1-5ms (cache hit)
- `POST /api/analytics/churn-prediction` → 1s-3s (Claude integration, first call)

#### Load Considerations
- 1000s of clients per org → Pagination required
- 100+ staff → `GET /api/staff` returns all; no filtering
- Heavy analytics → Use cache, don't call repeatedly

---

### Troubleshooting

#### 400 - missing_organization_id
**Cause:** No JWT with org context OR no x-org-id header  
**Fix:** Ensure Clerk token is valid and includes org claims, or add header:
```bash
-H "x-org-id: <org-uuid>"
```

#### 404 - client_not_found
**Cause:** Client ID doesn't exist in this org  
**Fix:** Check client ID is UUID format and belongs to your org

#### 202 - Unexpected Status on Mutation
**Note:** Loyalty redeem returns 202 Accepted (not 200) to indicate request queued for processing

#### Loyalty Points Not Updating
**Cause:** Client may not have phone (SMS not queued)  
**Check:**
1. Client has phone field populated
2. BullMQ is running (check queue depth)
3. SMS provider credentials configured

---

### Database Schema Reference

**New Tables:** (from 006_audience_schema.sql)
- `clients` (id, organization_id, email, full_name, phone, loyalty_points, membership_tier, preferences, risk_score, photo_url)
- `staff_members` (id, organization_id, email, full_name, role, specializations, availability, rating, photo_url, is_active)
- `service_categories` (id, slug, label, icon, vertical)
- `services` (id, organization_id, category_id, name, description, duration_minutes, price_cents)
- `loyalty_transactions` (id, client_id, type, points, balance_after, description, metadata)

**Modified Tables:**
- `bookings` → Added: client_id, staff_member_id, service_id, room, notes
- `invoices` → Added: client_id

**Seed Data:** (from 006b_seed_categories.sql)
- 8 service categories (hair, spa, nails, barbers, medspa, fitness, wellness, other)

---

### Next Steps (Sprint A3)

After Sprint A2 apis are integrated in frontend, proceed to:

1. **Staff Operations API**
   - GET /api/staff/today-schedule (for each staff member)
   - GET /api/staff/client-brief/:appointmentId (AI-generated briefs)
   - POST /api/staff/appointments/:id/status (status workflow)

2. **KÓRA Admin APIs**
   - GET /api/platform/tenant-health (multi-org monitoring)
   - GET /api/platform/ai-spend-summary (cost tracking)

3. **Notification Layer**
   - SMS on client creation (already queued)
   - Email on staff invite (already queued)
   - Payment reminders (new)

---

*For detailed API specs, see SPRINT_A2_IMPLEMENTATION_SUMMARY.md*
