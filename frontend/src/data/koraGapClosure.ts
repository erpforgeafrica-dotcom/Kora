/**
 * KÓRA Gap Closure Master Brief - Phases 5-10
 * Central data source for planning, documentation, and briefing
 */

export interface Phase {
  id: string;
  label: string;
  subtitle: string;
  weeks: string;
  color: string;
  icon: string;
  domains: string[];
  why: string;
}

export const PHASES: Phase[] = [
  {
    id: "phase5",
    label: "PHASE 5",
    subtitle: "Payment Infrastructure",
    weeks: "Weeks 1–4",
    color: "#00e5c8",
    icon: "◎",
    domains: ["Stripe POS", "Recurring Billing", "RCM Dashboard", "Multi-Currency"],
    why: "You cannot run a business on KÓRA until it can collect money. Every other feature is secondary to this."
  },
  {
    id: "phase6",
    label: "PHASE 6",
    subtitle: "Client Intelligence & CRM",
    weeks: "Weeks 5–8",
    color: "#a78bfa",
    icon: "◷",
    domains: ["Client 360", "Communication Hub", "Loyalty Engine", "NPS & Reputation"],
    why: "Revenue retention is 5× cheaper than acquisition. A client who feels known stays longer and spends more."
  },
  {
    id: "phase7",
    label: "PHASE 7",
    subtitle: "Clinical Completeness",
    weeks: "Weeks 9–14",
    color: "#22c55e",
    icon: "✚",
    domains: ["SOAP Notes + Ambient AI", "Telehealth", "Patient Portal", "Lab Orders"],
    why: "Without clinical-grade documentation and telehealth, KÓRA cannot be sold to healthcare customers."
  },
  {
    id: "phase8",
    label: "PHASE 8",
    subtitle: "Field Operations & HR",
    weeks: "Weeks 15–20",
    color: "#f59e0b",
    icon: "◈",
    domains: ["GPS Dispatch", "Work Orders", "Shift Scheduling", "Payroll"],
    why: "Field and workforce management closes the loop for service businesses — the largest segment of KÓRA's TAM."
  },
  {
    id: "phase9",
    label: "PHASE 9",
    subtitle: "Mobile + Compliance",
    weeks: "Weeks 21–26",
    color: "#34d058",
    icon: "◇",
    domains: ["Staff Mobile App", "Patient App", "HIPAA/GDPR Consent", "Regulatory Reporting"],
    why: "Mobile is a market requirement. Compliance is a legal requirement. Both block enterprise deals without them."
  },
  {
    id: "phase10",
    label: "PHASE 10",
    subtitle: "Ecosystem & AI Supremacy",
    weeks: "Weeks 27–32",
    color: "#c084fc",
    icon: "◈",
    domains: ["Open API + Webhooks", "Voice Commands", "Document AI", "Marketplace Foundation"],
    why: "Platform beats product. This phase transforms KÓRA from a tool into an ecosystem."
  }
];

export interface Moment {
  title: string;
  icon: string;
  color: string;
  desc: string;
}

export const INNOVATION_MOMENTS: Moment[] = [
  {
    title: "The Pre-Appointment Brief",
    icon: "◷",
    color: "#00e5c8",
    desc: "30 minutes before every booking, the assigned staff member receives: 'Amara Johnson | Session 14 | Last visit 18 days ago. Preference: window seat, low music. Outstanding: $0. Last note: knee pain improving, reduce intensity. NPS last session: 9. ◈ KÓRA says: mention the progress on the knee — she'll appreciate it.' This is what it feels like to be supported."
  },
  {
    title: "The Churn Prevention Moment",
    icon: "◉",
    color: "#a78bfa",
    desc: "Before a client slips away, KÓRA surfaces: 'Marcus Chen hasn't booked in 34 days (usually every 21). His last NPS was 7. He mentioned shoulder tension. [Send personalised check-in] — drafted and ready to send.' One click saves the relationship."
  },
  {
    title: "The Ambient Note",
    icon: "✚",
    color: "#22c55e",
    desc: "Provider ends session. Instead of 45 minutes of notes: 'KÓRA has drafted your SOAP note. It took 12 seconds. [Review note — 3 sections ready]' This is 2.5 hours back every day. That's a life change."
  },
  {
    title: "The Zero-Touch Claim",
    icon: "◎",
    color: "#f59e0b",
    desc: "Clinical session ends. Invoice created. KÓRA says: 'Insurance claim for Amara is ready. Pre-filled from today's session. [Submit in one click]' The claim that used to take 20 minutes takes 4 seconds."
  },
  {
    title: "The Voice Incident",
    icon: "⚡",
    color: "#ef4444",
    desc: "Emergency operator sees an incident unfolding. Both hands occupied. 'KÓRA, create incident — building collapse, 3 Commercial Road, 2 units responding, casualties unknown, code red.' Incident logged. Nearest units alerted. No keyboard touched."
  }
];

export const MASTER_PROMPT = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KÓRA — GAP CLOSURE MASTER BRIEF
PHASES 5–10  |  BOTH AGENTS  |  32-WEEK BUILD PLAN
Project Root: C:\\Users\\hp\\KORA
Foundation: Phases 1–4 complete — Auth, DB, AI Orchestration, UI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

READ THIS SECTION FIRST — THE PHILOSOPHY BEHIND THIS BUILD

KÓRA is not a feature list. It is a promise to the person managing
an operation — that they will never feel alone, never feel overwhelmed,
and never feel behind. Every feature in this brief exists because
someone, right now, is switching between 4 different tools to do
something KÓRA should do in one place.

Build with empathy first. Ask: who uses this at 2am during a crisis?
Who uses this when they've just lost a client? Who uses this when
the audit letter arrives? Design for that person, in that moment.
Then make it fast, beautiful, and intelligent.

Competing with: ServiceTitan · Epic · NextGen · PagerDuty · Square
               Cliniko · Tebra · Deputy · Gusto · Stripe

═══════════════════════════════════════════════════════════════════════
PHASE 5 — PAYMENT INFRASTRUCTURE  [Weeks 1–4]
"You cannot run a business on KÓRA until it can collect money."
═══════════════════════════════════════════════════════════════════════

EMPATHY NOTE: A clinic owner finishes a session, looks at their
patient, and has to say "I'll send you an invoice." The patient
leaves. 30% never pay. KÓRA must end this moment forever.

──────────────────────────────────────────────────────────────────────
BACKEND AGENT — P5 DATABASE MIGRATIONS
──────────────────────────────────────────────────────────────────────

Create: backend/src/db/migrations/005_payments.sql

  -- Stripe customer and payment method storage
  create table if not exists stripe_customers (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    client_id uuid references clients(id) on delete set null,
    user_id uuid references users(id) on delete set null,
    stripe_customer_id text not null unique,
    email text,
    metadata jsonb default '{}',
    created_at timestamptz default now()
  );

  -- POS transactions (card present + card not present)
  create table if not exists transactions (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    invoice_id uuid references invoices(id) on delete set null,
    booking_id uuid references bookings(id) on delete set null,
    stripe_payment_intent_id text unique,
    stripe_charge_id text,
    amount_cents integer not null,
    currency text not null default 'usd',
    status text not null check (status in ('pending','processing','succeeded','failed','refunded','partially_refunded')),
    payment_method text not null check (payment_method in ('card_present','card','bank_transfer','cash','loyalty_points','split')),
    receipt_url text,
    receipt_sent_at timestamptz,
    metadata jsonb default '{}',
    processed_by uuid references users(id),
    processed_at timestamptz,
    created_at timestamptz default now()
  );

  -- Split payment tracking
  create table if not exists transaction_splits (
    id uuid primary key default gen_random_uuid(),
    transaction_id uuid not null references transactions(id) on delete cascade,
    method text not null,
    amount_cents integer not null,
    stripe_payment_intent_id text,
    created_at timestamptz default now()
  );

  -- Recurring subscription plans
  create table if not exists subscription_plans (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name text not null,
    description text,
    amount_cents integer not null,
    currency text not null default 'usd',
    interval text not null check (interval in ('daily','weekly','monthly','quarterly','annually')),
    trial_days integer default 0,
    stripe_price_id text,
    features jsonb default '[]',
    is_active boolean default true,
    created_at timestamptz default now()
  );

  -- Active subscriptions
  create table if not exists subscriptions (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    client_id uuid references clients(id),
    plan_id uuid not null references subscription_plans(id),
    stripe_subscription_id text unique,
    status text not null check (status in ('active','past_due','canceled','paused','trialing')),
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean default false,
    canceled_at timestamptz,
    trial_end timestamptz,
    metadata jsonb default '{}',
    created_at timestamptz default now()
  );

  -- Insurance claims
  create table if not exists insurance_claims (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    client_id uuid references clients(id),
    booking_id uuid references bookings(id),
    invoice_id uuid references invoices(id),
    payer_name text not null,
    payer_id text,
    claim_number text,
    status text not null default 'draft' check (status in (
      'draft','submitted','pending','approved','partially_approved','denied','resubmitted','paid','written_off'
    )),
    billed_amount_cents integer not null,
    approved_amount_cents integer,
    paid_amount_cents integer,
    denial_reason text,
    denial_code text,
    submitted_at timestamptz,
    paid_at timestamptz,
    notes text,
    created_at timestamptz default now()
  );

  -- Currency rates (daily snapshot)
  create table if not exists currency_rates (
    id uuid primary key default gen_random_uuid(),
    base_currency text not null default 'usd',
    target_currency text not null,
    rate numeric(20,8) not null,
    date date not null,
    created_at timestamptz default now(),
    unique (base_currency, target_currency, date)
  );

  -- Indexes
  create index if not exists idx_transactions_org_created on transactions(organization_id, created_at desc);
  create index if not exists idx_transactions_invoice on transactions(invoice_id);
  create index if not exists idx_subscriptions_org_status on subscriptions(organization_id, status);
  create index if not exists idx_claims_org_status on insurance_claims(organization_id, status);

──────────────────────────────────────────────────────────────────────
BACKEND AGENT — P5 API ROUTES
──────────────────────────────────────────────────────────────────────

Create: backend/src/modules/payments/

  routes.ts — Register all payment routes
  service.ts — Business logic
  stripeClient.ts — Stripe SDK wrapper
  webhookHandler.ts — Stripe webhook processor

STRIPE SETUP (stripeClient.ts):
  import Stripe from 'stripe'
  
  export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20',
    typescript: true,
  })
  
  Install: npm install stripe

KEY ENDPOINTS TO BUILD:

  POST /api/payments/intent
    Body: { amount_cents, currency, invoice_id?, booking_id?, client_id? }
    Creates Stripe PaymentIntent
    Returns: { client_secret, payment_intent_id }
    
  POST /api/payments/pos/reader
    Body: { reader_id, payment_intent_id }
    Presents payment to physical Stripe Terminal reader
    For locations without hardware: fallback to manual card entry
    
  POST /api/payments/record
    Body: { stripe_payment_intent_id, payment_method, split_payments?: [] }
    Records completed transaction in DB
    Links to invoice → marks invoice as paid
    Enqueues receipt notification
    
  GET /api/payments/transactions
    Query: { start_date, end_date, status, method }
    Returns paginated transaction list for org
    
  POST /api/payments/subscriptions
    Body: { client_id, plan_id }
    Creates Stripe Subscription + local subscription record
    
  DELETE /api/payments/subscriptions/:id
    Cancel subscription (at period end by default)
    
  POST /api/payments/webhook
    Stripe webhook receiver (UNPROTECTED route — Stripe signature verification only)
    Handle events: payment_intent.succeeded, payment_intent.payment_failed,
                   invoice.payment_succeeded, customer.subscription.updated,
                   customer.subscription.deleted

EMPATHY IN EVERY ERROR STATE:
  Never show: "Error 500" or "Network request failed"
  Always show: What happened + What to do + Can KÓRA help?
  
  Wrong: "Payment failed"
  Right: "Payment did not go through — the card was declined.
         Offer the client a different payment method, or
         [Send payment link via SMS] so they can retry later."

═══════════════════════════════════════════════════════════════════════
SHARED IMPLEMENTATION STANDARDS — ALL PHASES
═══════════════════════════════════════════════════════════════════════

EMPATHY IN EVERY ERROR STATE:
  Never show: "Error 500" or "Network request failed"
  Always show: What happened + What to do + Can KÓRA help?

DATABASE STANDARDS:
  Every table: id (uuid), organization_id, created_at
  Soft deletes where data has compliance significance (is_active)
  Hard deletes for log/event tables
  Indexes on: org+created_at, foreign keys, status fields

SECURITY STANDARDS:
  All file uploads: virus scan before processing (ClamAV or Cloudflare)
  PHI/PII fields: encrypted at rest in Postgres (pgcrypto)
  Audit log: every mutation to clinical/financial data
  RBAC: every new endpoint must declare required role

TEST STANDARDS:
  Every new module: at minimum 3 integration tests
  Payment flows: full happy-path + failure simulation
  Clinical: SOAP generation + telehealth room lifecycle
  Webhook: delivery + retry + signature verification

═══════════════════════════════════════════════════════════════════════
INNOVATION MANDATES — WHAT MAKES KÓRA UNFORGETTABLE
═══════════════════════════════════════════════════════════════════════

These are not features. These are moments operators will tell others about.

1. THE PRE-APPOINTMENT BRIEF
   30 minutes before every booking, the assigned staff member receives:
   "Amara Johnson | Session 14 | Last visit 18 days ago
    Preference: window seat, low music | Outstanding: $0
    Last note: knee pain improving, reduce intensity
    NPS last session: 9 | Today: deep tissue, 60min
    ◈ KÓRA says: mention the progress on the knee — she'll appreciate it."
   This is what it feels like to be supported.

2. THE CHURN PREVENTION MOMENT
   Before a client slips away, KÓRA surfaces:
   "Marcus Chen hasn't booked in 34 days (usually every 21).
    His last NPS was 7. He mentioned shoulder tension.
    [Send personalised check-in] — drafted and ready to send."
   One click saves the relationship.

3. THE AMBIENT NOTE
   Provider ends session. Instead of 45 minutes of notes:
   "KÓRA has drafted your SOAP note. It took 12 seconds.
    [Review note — 3 sections ready]"
   This is 2.5 hours back every day. That's a life change.

4. THE ZERO-TOUCH CLAIM
   Clinical session ends. Invoice created. KÓRA says:
   "Insurance claim for Amara is ready. Pre-filled from today's 
    session. [Submit in one click]"
   The claim that used to take 20 minutes takes 4 seconds.

5. THE VOICE INCIDENT
   Emergency operator sees an incident unfolding. Both hands occupied.
   "KÓRA, create incident — building collapse, 3 Commercial Road,
    2 units responding, casualties unknown, code red."
   Incident logged. Nearest units alerted. No keyboard touched.

These are the moments KÓRA earns loyalty. Build toward these moments —
not toward features on a checklist.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
