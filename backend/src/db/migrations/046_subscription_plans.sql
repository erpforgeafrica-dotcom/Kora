-- Migration 046: Subscription Plans Catalog + Feature Gates + Usage Tracking
-- Owner: Database Team
-- Locked: 4 canonical KORA plans — Starter (free), Growth, Professional, Enterprise

-- ── Plan catalog (source of truth for all plan definitions) ──────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
  id              TEXT PRIMARY KEY,  -- 'starter' | 'growth' | 'professional' | 'enterprise'
  name            TEXT NOT NULL,
  tagline         TEXT NOT NULL,
  price_monthly   INTEGER NOT NULL DEFAULT 0,  -- cents USD (0 = free)
  price_yearly    INTEGER NOT NULL DEFAULT 0,  -- cents USD (0 = free), ~20% discount
  currency        TEXT NOT NULL DEFAULT 'usd',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  is_free         BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Feature limits per plan ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_features (
  plan_id                   TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  -- Limits (-1 = unlimited)
  max_locations             INTEGER NOT NULL DEFAULT 1,
  max_staff                 INTEGER NOT NULL DEFAULT 3,
  max_clients               INTEGER NOT NULL DEFAULT 100,
  max_bookings_per_month    INTEGER NOT NULL DEFAULT 50,
  max_ai_requests_per_month INTEGER NOT NULL DEFAULT 0,
  max_api_calls_per_day     INTEGER NOT NULL DEFAULT 0,
  -- Module access flags
  module_bookings           BOOLEAN NOT NULL DEFAULT true,
  module_clients            BOOLEAN NOT NULL DEFAULT true,
  module_staff              BOOLEAN NOT NULL DEFAULT true,
  module_services           BOOLEAN NOT NULL DEFAULT true,
  module_payments           BOOLEAN NOT NULL DEFAULT true,
  module_crm                BOOLEAN NOT NULL DEFAULT false,
  module_inventory          BOOLEAN NOT NULL DEFAULT false,
  module_delivery           BOOLEAN NOT NULL DEFAULT false,
  module_clinical           BOOLEAN NOT NULL DEFAULT false,
  module_emergency          BOOLEAN NOT NULL DEFAULT false,
  module_ai_insights        BOOLEAN NOT NULL DEFAULT false,
  module_ai_orchestration   BOOLEAN NOT NULL DEFAULT false,
  module_analytics          BOOLEAN NOT NULL DEFAULT false,
  module_marketing          BOOLEAN NOT NULL DEFAULT false,
  module_social             BOOLEAN NOT NULL DEFAULT false,
  module_video              BOOLEAN NOT NULL DEFAULT false,
  module_automation         BOOLEAN NOT NULL DEFAULT false,
  module_content            BOOLEAN NOT NULL DEFAULT false,
  module_support            BOOLEAN NOT NULL DEFAULT false,
  module_white_label        BOOLEAN NOT NULL DEFAULT false,
  module_api_access         BOOLEAN NOT NULL DEFAULT false,
  module_custom_roles       BOOLEAN NOT NULL DEFAULT false,
  module_audit_logs         BOOLEAN NOT NULL DEFAULT false,
  module_sso                BOOLEAN NOT NULL DEFAULT false,
  -- Support tier
  support_tier              TEXT NOT NULL DEFAULT 'community',  -- community | email | priority | dedicated
  sla_response_hours        INTEGER,
  PRIMARY KEY (plan_id)
);

-- ── Organization plan assignment ──────────────────────────────────────────────
-- Extends existing subscriptions table with plan reference
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES subscription_plans(id),
  ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'yearly', 'free')),
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seats_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- ── Usage tracking ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_usage (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id     UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  period_start        TIMESTAMPTZ NOT NULL,
  period_end          TIMESTAMPTZ NOT NULL,
  bookings_count      INTEGER NOT NULL DEFAULT 0,
  ai_requests_count   INTEGER NOT NULL DEFAULT 0,
  api_calls_count     INTEGER NOT NULL DEFAULT 0,
  staff_count         INTEGER NOT NULL DEFAULT 0,
  locations_count     INTEGER NOT NULL DEFAULT 0,
  clients_count       INTEGER NOT NULL DEFAULT 0,
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_org_period
  ON subscription_usage (organization_id, period_start DESC);

-- ── Plan change audit ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,  -- 'created','upgraded','downgraded','cancelled','reactivated','trial_started','trial_ended','payment_failed','payment_succeeded'
  from_plan       TEXT,
  to_plan         TEXT,
  actor_id        TEXT,           -- Clerk user ID
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_org
  ON subscription_events (organization_id, created_at DESC);

-- ── Seed the 4 canonical plans ────────────────────────────────────────────────
INSERT INTO subscription_plans (id, name, tagline, price_monthly, price_yearly, is_free, sort_order)
VALUES
  ('starter',      'Starter',      'Everything you need to get started — free forever',                    0,      0,      true,  1),
  ('growth',       'Growth',       'For growing businesses ready to scale operations',                     4900,   47040,  false, 2),
  ('professional', 'Professional', 'Full platform power with AI, clinical, and emergency modules',         14900,  143040, false, 3),
  ('enterprise',   'Enterprise',   'Unlimited scale, white-label, dedicated support, and full API access', 49900,  479040, false, 4)
ON CONFLICT (id) DO UPDATE SET
  name           = EXCLUDED.name,
  tagline        = EXCLUDED.tagline,
  price_monthly  = EXCLUDED.price_monthly,
  price_yearly   = EXCLUDED.price_yearly,
  is_free        = EXCLUDED.is_free,
  sort_order     = EXCLUDED.sort_order,
  updated_at     = now();

-- ── Seed feature gates per plan ───────────────────────────────────────────────
INSERT INTO plan_features (
  plan_id,
  max_locations, max_staff, max_clients, max_bookings_per_month, max_ai_requests_per_month, max_api_calls_per_day,
  module_bookings, module_clients, module_staff, module_services, module_payments,
  module_crm, module_inventory, module_delivery, module_clinical, module_emergency,
  module_ai_insights, module_ai_orchestration, module_analytics, module_marketing,
  module_social, module_video, module_automation, module_content, module_support,
  module_white_label, module_api_access, module_custom_roles, module_audit_logs, module_sso,
  support_tier, sla_response_hours
)
VALUES
  -- STARTER: free, 1 location, 3 staff, 100 clients, 50 bookings/mo, core only
  ('starter',
   1, 3, 100, 50, 0, 0,
   true, true, true, true, true,
   false, false, false, false, false,
   false, false, false, false,
   false, false, false, false, false,
   false, false, false, false, false,
   'community', NULL),

  -- GROWTH: $49/mo, 3 locations, 15 staff, 500 clients, 500 bookings/mo, + CRM/inventory/delivery/analytics/marketing
  ('growth',
   3, 15, 500, 500, 100, 1000,
   true, true, true, true, true,
   true, true, true, false, false,
   true, false, true, true,
   true, false, true, true, true,
   false, false, false, true, false,
   'email', 48),

  -- PROFESSIONAL: $149/mo, unlimited locations, 50 staff, unlimited clients, unlimited bookings, + clinical/emergency/AI/video/automation
  ('professional',
   -1, 50, -1, -1, 1000, 10000,
   true, true, true, true, true,
   true, true, true, true, true,
   true, true, true, true,
   true, true, true, true, true,
   false, true, true, true, false,
   'priority', 8),

  -- ENTERPRISE: $499/mo, unlimited everything, white-label, SSO, dedicated support
  ('enterprise',
   -1, -1, -1, -1, -1, -1,
   true, true, true, true, true,
   true, true, true, true, true,
   true, true, true, true,
   true, true, true, true, true,
   true, true, true, true, true,
   'dedicated', 2)
ON CONFLICT (plan_id) DO UPDATE SET
  max_locations              = EXCLUDED.max_locations,
  max_staff                  = EXCLUDED.max_staff,
  max_clients                = EXCLUDED.max_clients,
  max_bookings_per_month     = EXCLUDED.max_bookings_per_month,
  max_ai_requests_per_month  = EXCLUDED.max_ai_requests_per_month,
  max_api_calls_per_day      = EXCLUDED.max_api_calls_per_day,
  module_crm                 = EXCLUDED.module_crm,
  module_inventory           = EXCLUDED.module_inventory,
  module_delivery            = EXCLUDED.module_delivery,
  module_clinical            = EXCLUDED.module_clinical,
  module_emergency           = EXCLUDED.module_emergency,
  module_ai_insights         = EXCLUDED.module_ai_insights,
  module_ai_orchestration    = EXCLUDED.module_ai_orchestration,
  module_analytics           = EXCLUDED.module_analytics,
  module_marketing           = EXCLUDED.module_marketing,
  module_social              = EXCLUDED.module_social,
  module_video               = EXCLUDED.module_video,
  module_automation          = EXCLUDED.module_automation,
  module_content             = EXCLUDED.module_content,
  module_support             = EXCLUDED.module_support,
  module_white_label         = EXCLUDED.module_white_label,
  module_api_access          = EXCLUDED.module_api_access,
  module_custom_roles        = EXCLUDED.module_custom_roles,
  module_audit_logs          = EXCLUDED.module_audit_logs,
  module_sso                 = EXCLUDED.module_sso,
  support_tier               = EXCLUDED.support_tier,
  sla_response_hours         = EXCLUDED.sla_response_hours;
