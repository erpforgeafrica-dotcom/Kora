# Phase 5 Launch Checklist

## Pre-Launch (Do This First)

### Backend Agent A Pre-Flight
- [ ] `cd c:\Users\hp\KORA\backend`
- [ ] `docker compose up -d postgres redis` (in KORA root)
- [ ] `npm run typecheck` → must pass
- [ ] `npm test` → all existing tests pass (record count for sign-off)
- [ ] `npm run db:migrate` → verify migrations 001-004 applied
- [ ] `npm install stripe` 
- [ ] `npm install --save-dev @types/stripe`
- [ ] Check `.env` has `STRIPE_SECRET_KEY` stub or example

### Frontend Agent B Pre-Flight
- [ ] `cd c:\Users\hp\KORA\frontend`
- [ ] `npm run build` → 0 errors
- [ ] `npm install stripe-js react-stripe-js`
- [ ] `npm install recharts` (verify already installed)
- [ ] Check `.env` has `VITE_STRIPE_PUBLISHABLE_KEY` stub
- [ ] Route `/phase5-launch` loads without errors

---

## Parallel Work (Both Agents Week 1)

### Agent A — Backend
**Task 01: Database Migration**
- [ ] Create file: `backend/src/db/migrations/005_payments.sql`
- [ ] Copy migration SQL from prompt
- [ ] Run: `npm run db:migrate`
- [ ] Verify: `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
- [ ] Confirm all 10 new tables exist: clients, currency_rates, dunning_events, insurance_claims, rcm_snapshots, stripe_customers, subscriptions, subscription_plans, transaction_splits, transactions

**Task 02: Stripe Client**
- [ ] Create file: `backend/src/services/stripeClient.ts`
- [ ] Export: `stripe`, `getOrCreateStripeCustomer()`
- [ ] Type check: `npm run typecheck`

**Task 03: Payment Service**
- [ ] Create file: `backend/src/modules/payments/service.ts`
- [ ] Implement 5 core functions (see prompt for signatures)
- [ ] Type check: `npm run typecheck`

**Task 04: Payment Routes**
- [ ] Create file: `backend/src/modules/payments/routes.ts`
- [ ] Implement 11 endpoints (see prompt for specifications)
- [ ] Register in main app router under `/api/payments`
- [ ] Rate limits: payment actions 20/min, read 100/min per org

### Agent B — Frontend
**Task 01: Type Contracts**
- [ ] Create file: `frontend/src/types/payments.ts`
- [ ] Define: PaymentStatus, PaymentMethod, Transaction, SubscriptionPlan, Subscription, InsuranceClaim, RCMMetrics, CheckoutState
- [ ] Type check: `npm run typecheck`

**Task 02: API Client Extensions**
- [ ] Edit file: `frontend/src/services/api.ts`
- [ ] Add 10 payment methods (createPaymentIntent, recordTransaction, recordCashPayment, etc.)
- [ ] Type check: `npm run typecheck`

**Task 03: Checkout Panel (Flagship)**
- [ ] Create file: `frontend/src/modules/payments/CheckoutPanel.tsx`
- [ ] Implement 4 tabs: CARD, CASH, SPLIT, INSURANCE
- [ ] Implement states: input, processing, success, error
- [ ] Use Stripe Elements (no raw card data)
- [ ] Animations: slide-in 280ms, success checkmark scale-in 400ms, auto-close 4s
- [ ] Theme: Dark background #141720, teal accent #00e5c8, calm error styling (no harsh red)

**Task 04: RCM Dashboard**
- [ ] Create file: `frontend/src/modules/payments/RCMDashboard.tsx`
- [ ] Route: `/finance/rcm`
- [ ] Layout: AI brief + 4 KPI cards + aging chart + claims funnel
- [ ] KPIs: days_in_ar, collection_rate, denial_rate, net_collection_pct
- [ ] Threshold colors (success/warning/danger) per specification
- [ ] AI brief uses cached narrative with streaming feel

**Task 05: Transaction History**
- [ ] Create file: `frontend/src/modules/payments/TransactionHistory.tsx`
- [ ] Props: clientId?, invoiceId?, limit?, showFilters?
- [ ] Table columns: Date/Time, Method, Amount, Status, Client, Action
- [ ] Status badges with colors
- [ ] Method icons (card, cash, insurance, split)
- [ ] Inline row expansion + filters + pagination + CSV export

---

## Week 2-3: Backend Completion & AI Integration

### Agent A — Continued
**Task 05: Stripe Webhook Handler**
- [ ] In `backend/src/modules/payments/routes.ts`: Add `POST /api/payments/webhook`
- [ ] Handle 5 events: payment_intent.succeeded/failed, invoice.payment_succeeded/failed, customer.subscription.deleted
- [ ] Verify: `stripe.webhooks.constructEvent()` signature validation
- [ ] On success: update transactions, invoices, subscriptions; enqueue notifications

**Task 06: AI Payment Intelligence**
- [ ] Edit: `backend/src/workers/workers.ts`
- [ ] Add payment intelligence cycle (runs every 6 hours)
- [ ] Implement 4 jobs: collection opportunity scoring, churn-from-payment signal, RCM snapshot, anomaly detection

**Task 07: Signal Aggregator Update**
- [ ] Edit: `backend/src/modules/ai/orchestration/signalAggregator.ts`
- [ ] Add `payments` module to ModuleSignalSnapshot
- [ ] Add causality pattern: payment failures + open incidents = revenue risk

### Agent B — Continued
**Task 06: Navigation + Route Wiring**
- [ ] Edit: `frontend/src/components/layout/AppShell.tsx`
- [ ] Add Finance module to sidebar if not present
- [ ] Create Finance sub-navigation structure

- [ ] Edit: `frontend/src/App.tsx`
- [ ] Add Finance routes: /finance, /finance/rcm, /finance/transactions, /finance/subscriptions, /finance/claims
- [ ] Wire <CheckoutPanel /> trigger to invoice/booking cards
- [ ] Lazy-load Stripe Elements only when CARD tab opens (not on full app load)

---

## Week 3-4: Testing & Cross-Check

### Agent A — Testing
**Task 06: Integration Tests**
- [ ] Create file: `backend/src/tests/payments.test.ts`
- [ ] Write 12+ tests (see prompt for test cases)
- [ ] Mock Stripe SDK and database calls
- [ ] Run: `npm test` → all tests pass (record count: expect current_count + 12+)
- [ ] Type check: `npm run typecheck`

### Agent B — Testing
**Task 07: Build & Verify**
- [ ] `npm run build` → 0 errors, 0 warnings
- [ ] Verify all routes load: /phase5-launch, /finance, /finance/rcm, /finance/transactions
- [ ] Verify CheckoutPanel opens with test data
- [ ] Verify RCMDashboard charts render
- [ ] Verify TransactionHistory table displays

---

## Cross-Check Phase (End of Week 4)

### Agent A → Agent B
Read frontend files:
- [ ] `frontend/src/modules/payments/CheckoutPanel.tsx`
- [ ] `frontend/src/modules/payments/RCMDashboard.tsx`
- [ ] `frontend/src/modules/payments/TransactionHistory.tsx`

Verify:
- [ ] All API endpoints you built are called by frontend
- [ ] Request/response shapes match exactly
- [ ] Webhook events integrate correctly with frontend state updates

### Agent B → Agent A
Read backend files:
- [ ] `backend/src/modules/payments/routes.ts`
- [ ] `backend/src/modules/payments/service.ts`
- [ ] `backend/src/services/stripeClient.ts`
- [ ] `backend/src/db/migrations/005_payments.sql`
- [ ] `backend/PHASE5_AGENT_A_REPORT.md`

Verify:
- [ ] Every endpoint you call exists and has correct signature
- [ ] Response types match your TypeScript contracts
- [ ] All 10 DB tables created and indexed
- [ ] Stripe integration complete (webhook secret validation, event handling)

---

## Sign-Off Reports (Required Before Merge)

### Agent A Report: `backend/PHASE5_AGENT_A_REPORT.md`
```markdown
## Phase 5 Backend — Agent A Sign-Off Report

### Migration Verification
- Tables created: [list all 10]
- Indexes confirmed: [count]
- Migration ran without errors: YES/NO

### Test Results
- npm run typecheck: PASS/FAIL
- npm test: X/X passing (was Y/Y before, now Z/Z)
- New payment tests: count

### Frontend Cross-Check
- API shapes match: YES/NO
- Mismatches found: [list or "none"]

### Signal Aggregator
- payments module added: YES/NO
- causality patterns: count

### AI Integration
- Worker cycle updated: YES/NO
- RCM snapshot job: YES/NO
- Collection opportunity scoring: YES/NO

### Innovation Observation
[One enhancement you noticed while building]

### KÓRA Differentiator Confirmed
"The checkout moment is not just a Stripe call..."
```

### Agent B Report: `frontend/PHASE5_AGENT_B_REPORT.md`
```markdown
## Phase 5 Frontend — Agent B Sign-Off Report

### Build Status
- npm run build: PASS/FAIL (0 errors required)

### Components Delivered
- CheckoutPanel: all 4 tabs working
- RCMDashboard: all KPI cards + charts
- TransactionHistory: table + filters + pagination
- Finance routes: all navigable
- Collect Payment button: in invoices + bookings

### Stripe Integration
- PaymentElement mounted: YES/NO
- CARD tab completes flow: YES/NO
- CASH tab records: YES/NO

### Backend Cross-Check
- All endpoints verified: YES/NO
- Type contracts aligned: YES/NO
- Mismatches: [list or "none"]

### Theme Compliance
- All var(--color-*) used: YES/NO
- Error states calm (no harsh red): YES/NO

### Innovation Observation
[One feature competitors don't have]

### The Moment This Phase Creates
"The checkout experience is now as calm and dignified..."
```

---

## Deployment Checklist (After Sign-Off)

- [ ] Both reports written and approved
- [ ] All tests passing (backend + frontend)
- [ ] No TypeScript errors
- [ ] `npm run build` succeeds (frontend)
- [ ] Stripe test credentials in .env
- [ ] Migration file tested (tables verified)
- [ ] API routes rate-limited correctly
- [ ] Webhook signature validation working
- [ ] CheckoutPanel animations smooth (tested in browser)
- [ ] RCM dashboard loads without errors
- [ ] Navigation wiring complete (all routes reachable)

---

## Success Criteria

✅ **Backend Agent A**
- 10 new DB tables created and indexed
- 11 API endpoints operational
- 5 Stripe webhook events handled
- Payment intelligence worker running
- 12+ new integration tests passing
- Signal aggregator integrated
- 0 TypeScript errors
- Sign-off report written

✅ **Frontend Agent B**
- 3 new payment components built
- 10 API methods implemented
- CheckoutPanel fully functional (4 tabs)
- RCMDashboard displaying all metrics
- TransactionHistory table + filters + pagination
- Finance routes fully wired
- 0 build errors
- 0 hardcoded colors (all var(--color-*))
- Sign-off report written

✅ **Cross-Check**
- Backend and frontend API shapes match perfectly
- No endpoint mismatches
- All 10 DB tables accessible from frontend
- Stripe webhook events flow through to UI
- Both agents approved each other's work

✅ **Ready to Deploy**
- Both reports signed off
- All tests green
- Code review approved
- Ready for staging deployment

---

## Estimated Timeline

| Week | Phase | Agent A | Agent B | Status |
|------|-------|---------|---------|--------|
| 1 | Migration + Types | 005_payments.sql | payments.ts | 🔄 In Progress |
| 1 | Services + API | stripeClient, service, routes | api.ts extensions | 🔄 In Progress |
| 2 | Components | Webhooks + Worker | CheckoutPanel + RCMDashboard | ⏳ Upcoming |
| 3 | AI Integration | Signal aggregator | TransactionHistory + Navigation | ⏳ Upcoming |
| 4 | Testing | Tests + Verification | Build + Cross-check | ⏳ Upcoming |
| 4 | Sign-Off | Agent A Report | Agent B Report | ⏳ Upcoming |

**Total Effort**: ~32 hours (both agents working in parallel)

---

## Questions?
Refer to:
1. **Full Spec**: Open `/phase5-launch` → PROMPT tab → copy full brief
2. **Overview**: `/phase5-launch` → OVERVIEW tab → see timeline + human moment
3. **Deliverables**: `/phase5-launch` → DELIVERABLES tab → see all work items
