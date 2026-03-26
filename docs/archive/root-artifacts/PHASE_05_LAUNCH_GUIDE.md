# KÓRA Gap Closure — Phases 5–10

**Status:** Reference & Planning  
**Last Updated:** 2026-03-06  
**Scope:** 32-week implementation roadmap covering Phases 5–10  
**Competing With:** ServiceTitan · Epic · NextGen · PagerDuty · Square · Cliniko · Tebra · Deputy · Gusto · Stripe

---

## Quick Navigation

- **Component:** `frontend/src/components/PlanningCenter.tsx`
- **Data Source:** `frontend/src/data/koraGapClosure.ts`  
- **Master Brief:** View via PlanningCenter "PROMPT" tab

---

## The Philosophy

KÓRA is not a feature list. It is a **promise** to the person managing an operation:
- You will never feel alone
- You will never feel overwhelmed
- You will never feel behind

Every feature in this brief exists because someone, right now, is switching between 4 different tools to do something KÓRA should do in one place.

### Build with Empathy
Ask these questions before writing any code:
1. **Who uses this at 2am during a crisis?**
2. **Who uses this when they've just lost a client?**
3. **Who uses this when the audit letter arrives?**

Design for that person, in that moment. Then make it fast, beautiful, and intelligent.

---

## The 5 Moments That Earn Loyalty

These are not features—they're moments operators will tell others about:

### 1. **The Pre-Appointment Brief**
30 minutes before every booking, staff receive:
```
Amara Johnson | Session 14 | Last visit 18 days ago
Preference: window seat, low music | Outstanding: $0
Last note: knee pain improving, reduce intensity
NPS last session: 9 | Today: deep tissue, 60min  
◈ KÓRA says: mention the progress on the knee — she'll appreciate it.
```
*This is what it feels like to be supported.*

### 2. **The Churn Prevention Moment**
Before a client slips away:
```
Marcus Chen hasn't booked in 34 days (usually every 21).
His last NPS was 7. He mentioned shoulder tension.
[Send personalised check-in] — drafted and ready to send.
```
*One click saves the relationship.*

### 3. **The Ambient Note**
Provider ends session. Instead of 45 minutes of notes:
```
KÓRA has drafted your SOAP note. It took 12 seconds.
[Review note — 3 sections ready]
```
*This is 2.5 hours back every day. That's a life change.*

### 4. **The Zero-Touch Claim**
Clinical session ends. Invoice created:
```
Insurance claim for Amara is ready. Pre-filled from today's session.
[Submit in one click]
```
*The claim that used to take 20 minutes takes 4 seconds.*

### 5. **The Voice Incident**
Emergency operator, both hands occupied:
```
"KÓRA, create incident — building collapse, 3 Commercial Road,
2 units responding, casualties unknown, code red."
```
*Incident logged. Nearest units alerted. No keyboard touched.*

---

## Phase Breakdown

| Phase | Focus | Weeks | Why It Matters |
|-------|-------|-------|---|
| **P5** | Payment Infrastructure | 1–4 | You cannot run a business on KÓRA until it can collect money |
| **P6** | Client Intelligence & CRM | 5–8 | Revenue retention is 5× cheaper than acquisition |
| **P7** | Clinical Completeness | 9–14 | Without clinical-grade documentation, KÓRA cannot be sold to healthcare |
| **P8** | Field Operations & HR | 15–20 | Closes the loop for service businesses—the largest TAM segment |
| **P9** | Mobile + Compliance | 21–26 | Mobile and compliance block enterprise deals without them |
| **P10** | Ecosystem & AI Supremacy | 27–32 | Platform beats product—this phase transforms KÓRA from tool to ecosystem |

---

## Implementation Standards (All Phases)

### Database Conventions
- Every table: `id` (uuid), `organization_id`, `created_at`
- Soft deletes where data has compliance significance (`is_active`)
- Hard deletes for log/event tables
- Indexes on: `org+created_at`, foreign keys, status fields

### Error States (Empathy First)
❌ **Never show:** "Error 500" or "Network request failed"  
✅ **Always show:** What happened + What to do + Can KÓRA help?

### Security Standards
- File uploads: virus scan before processing (ClamAV or Cloudflare)
- PHI/PII fields: encrypted at rest in Postgres (`pgcrypto`)
- Audit log: every mutation to clinical/financial data
- RBAC: every endpoint declares required role

### Testing Requirements
- Every new module: minimum 3 integration tests
- Payment flows: happy-path + failure simulation
- Clinical: SOAP generation + telehealth room lifecycle
- Webhooks: delivery + retry + signature verification

### AI Integration Standard
Every module contributes to the signal aggregator:
- **Payments** → revenue anomalies, overdue collection opportunities
- **CRM** → churn risk, NPS drops, communication gaps
- **Clinical** → lab result flags, documentation backlogs
- **Field** → dispatch bottlenecks, inventory stockouts
- **HR** → scheduling conflicts, overtime alerts

The AI Command Center remains the unified surface where KÓRA's intelligence surfaces what matters—across all modules at once.

---

## Build Order per Phase

1. Backend: Run migration SQL → verify tables
2. Backend: Build API routes + service layer
3. Backend: AI integration + worker jobs
4. Frontend: Build module components
5. Frontend: Wire into AppShell navigation
6. Both: Integration tests + cross-check reports
7. Both: Signal aggregator update — new module signals

---

## How to Use This Component

### In the Frontend App
```tsx
import PlanningCenter from './components/PlanningCenter';

// Add to AppShell or navigation
<PlanningCenter />
```

### Tabs Available
- **PHASES:** Interactive phase selector + deliverables
- **MOMENTS:** 5 innovation moments that define KÓRA
- **PROMPT:** Full master brief for AI agent context (copy-paste ready)

### Exporting the Master Prompt
The entire Phase 5–10 brief is copy-paste ready. Use in:
- Agent briefing documents
- Team kickoff meetings
- Development kickoff with both backend & frontend agents
- Cross-check reports against implementation progress

---

## Module Structure Reference

### Phase 5: Payments
```
backend/src/modules/payments/
  ├── routes.ts          (API endpoints)
  ├── service.ts         (Business logic)
  ├── stripeClient.ts    (Stripe SDK wrapper)
  └── webhookHandler.ts  (Stripe events)

frontend/src/modules/payments/
  ├── CheckoutPanel.tsx      (POS checkout)
  ├── SubscriptionBuilder.tsx (Plan creation)
  ├── RCMDashboard.tsx        (Revenue cycle metrics)
  └── TransactionHistory.tsx  (Transaction log)
```

### Phase 6: CRM
```
backend/src/modules/crm/
  ├── routes.ts           (Client endpoints)
  ├── service.ts
  ├── communicationService.ts

frontend/src/modules/crm/
  ├── ClientList.tsx
  ├── ClientProfile.tsx
  ├── CommunicationComposer.tsx
  ├── LoyaltyCard.tsx
  └── NPSSurveyWidget.tsx
```

*Similar structure repeats for Phases 7–10*

---

## Key Migrations (Create in Order)

```sql
-- Phase 5
backend/src/db/migrations/005_payments.sql

-- Phase 6  
backend/src/db/migrations/006_crm.sql

-- Phase 7
backend/src/db/migrations/007_clinical.sql

-- Phase 8
backend/src/db/migrations/008_field_hr.sql

-- Phase 9
backend/src/db/migrations/009_mobile_compliance.sql

-- Phase 10
backend/src/db/migrations/010_ecosystem.sql
```

---

## Critical Dates

- **Phases 1–4:** ✅ Complete (Foundation)
- **Phase 5 Start:** Week 1 (Payment Infrastructure — highest priority)
- **Phase 10 Complete:** Week 32 (Ecosystem & AI Supremacy)

---

## Reference Links

- **PlanningCenter Component:** `frontend/src/components/PlanningCenter.tsx`
- **Data File:** `frontend/src/data/koraGapClosure.ts`
- **Phases 1–4 Status:** See `PHASE_04_COMPLETE.md` and related reports
- **Master Brief (Full):** Copy from PlanningCenter "PROMPT" tab

---

## Notes for Implementation Teams

### For Backend Agent
- Run migrations in sequence (005 → 010)
- Each phase should have corresponding API test file
- AI client calls should target specific task types (for APM tracking)
- Webhook handlers require signature verification (Stripe, daily.co, etc.)

### For Frontend Agent
- Component theming follows KORA design tokens (see existing design)
- All modules wire into AppShell navigation
- Use the innovation moments as UX acceptance criteria
- Empty states should show empathy, not error codes

### For Both Agents
- Before coding Phase N, review Phase N section in master brief
- Cross-check reports every 2 weeks against deliverables
- AI signal aggregator expands with each new module
- Test coverage minimum: 3 integration tests per module

---

**Built with empathy. Built to last. Build toward the moments.**
