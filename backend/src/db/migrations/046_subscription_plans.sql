-- 046_subscription_plans.sql
-- Extends existing subscription_plans (uuid PK) with KORA plan catalog
-- Creates plan_features table for feature gate enforcement
-- Safe to run against existing schema

BEGIN;

-- ── Step 1: Add missing columns to existing subscription_plans ────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='slug') THEN
    ALTER TABLE subscription_plans ADD COLUMN slug TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='tagline') THEN
    ALTER TABLE subscription_plans ADD COLUMN tagline TEXT NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='price_monthly') THEN
    ALTER TABLE subscription_plans ADD COLUMN price_monthly INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='price_yearly') THEN
    ALTER TABLE subscription_plans ADD COLUMN price_yearly INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='is_free') THEN
    ALTER TABLE subscription_plans ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='sort_order') THEN
    ALTER TABLE subscription_plans ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='stripe_price_id_monthly') THEN
    ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_monthly TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='stripe_price_id_yearly') THEN
    ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_yearly TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscription_plans' AND column_name='updated_at') THEN
    ALTER TABLE subscription_plans ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_plans_slug
  ON subscription_plans(slug) WHERE slug IS NOT NULL;

-- organization_id is NOT NULL in existing table but platform plans have no org
-- Make it nullable for platform-level plan catalog entries
ALTER TABLE subscription_plans ALTER COLUMN organization_id DROP NOT NULL;

-- ── Step 2: Seed the 4 canonical KORA plans ───────────────────────────────────
-- Uses slug uniqueness to prevent duplicates
INSERT INTO subscription_plans (id, slug, name, tagline, price_monthly, price_yearly, is_free, sort_order, amount_cents, currency, interval, is_active, created_at, updated_at)
SELECT gen_random_uuid(), v.slug, v.name, v.tagline, v.price_monthly, v.price_yearly, v.is_free, v.sort_order, v.price_monthly, 'usd', 'monthly', true, now(), now()
FROM (VALUES
  ('starter',      'Starter',      'Everything you need to get started — free forever',                    0,      0,      true,  1),
  ('growth',       'Growth',       'For growing businesses ready to scale operations',                     4900,   47040,  false, 2),
  ('professional', 'Professional', 'Full platform power with AI, clinical, and emergency modules',         14900,  143040, false, 3),
  ('enterprise',   'Enterprise',   'Unlimited scale, white-label, dedicated support, and full API access', 49900,  479040, false, 4)
) AS v(slug, name, tagline, price_monthly, price_yearly, is_free, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM subscription_plans sp WHERE sp.slug = v.slug);

-- ── Step 3: Create plan_features table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_features (
  plan_id                   UUID NOT NULL,
  max_locations             INTEGER NOT NULL DEFAULT 1,
  max_staff                 INTEGER NOT NULL DEFAULT 3,
  max_clients               INTEGER NOT NULL DEFAULT 100,
  max_bookings_per_month    INTEGER NOT NULL DEFAULT 50,
  max_ai_requests_per_month INTEGER NOT NULL DEFAULT 0,
  max_api_calls_per_day     INTEGER NOT NULL DEFAULT 0,
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
  support_tier              TEXT NOT NULL DEFAULT 'community',
  sla_response_hours        INTEGER,
  PRIMARY KEY (plan_id)
);

-- ── Step 4: Seed plan_features using slug → plan_id subquery ─────────────────
INSERT INTO plan_features (
  plan_id,
  max_locations, max_staff, max_clients, max_bookings_per_month, max_ai_requests_per_month, max_api_calls_per_day,
  module_crm, module_inventory, module_delivery, module_clinical, module_emergency,
  module_ai_insights, module_ai_orchestration, module_analytics, module_marketing,
  module_social, module_video, module_automation, module_content, module_support,
  module_white_label, module_api_access, module_custom_roles, module_audit_logs, module_sso,
  support_tier, sla_response_hours
)
SELECT
  (SELECT id FROM subscription_plans WHERE slug = v.slug LIMIT 1),
  v.max_loc, v.max_staff, v.max_clients, v.max_book, v.max_ai, v.max_api,
  v.crm, v.inv, v.del, v.clin, v.emerg,
  v.ai_ins, v.ai_orch, v.analytics, v.mktg,
  v.social, v.video, v.auto, v.content, v.support,
  v.wl, v.api_acc, v.custom_roles, v.audit, v.sso,
  v.sup_tier, v.sla
FROM (VALUES
  -- starter: free, 1 loc, 3 staff, 100 clients, 50 bookings, core only
  ('starter', 1,  3,  100, 50,   0,     0,     false,false,false,false,false, false,false,false,false, false,false,false,false,false, false,false,false,false,false, 'community', NULL::int),
  -- growth: $49, 3 loc, 15 staff, 500 clients, 500 bookings
  ('growth',  3,  15, 500, 500,  100,   1000,  true, true, true, false,false, true, false,true, true,  true, false,true, true, true,  false,false,false,true, false, 'email',     48),
  -- professional: $149, unlimited loc, 50 staff
  ('professional', -1, 50, -1, -1, 1000, 10000, true,true,true,true,true, true,true,true,true, true,true,true,true,true, false,true,true,true,false, 'priority', 8),
  -- enterprise: $499, unlimited everything
  ('enterprise', -1, -1, -1, -1, -1, -1, true,true,true,true,true, true,true,true,true, true,true,true,true,true, true,true,true,true,true, 'dedicated', 2)
) AS v(slug, max_loc, max_staff, max_clients, max_book, max_ai, max_api,
       crm, inv, del, clin, emerg, ai_ins, ai_orch, analytics, mktg,
       social, video, auto, content, support, wl, api_acc, custom_roles, audit, sso,
       sup_tier, sla)
WHERE EXISTS (SELECT 1 FROM subscription_plans WHERE slug = v.slug)
  AND NOT EXISTS (
    SELECT 1 FROM plan_features pf
    WHERE pf.plan_id = (SELECT id FROM subscription_plans WHERE slug = v.slug LIMIT 1)
  );

-- ── Step 5: Supporting tables ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID,
  period_start    TIMESTAMPTZ NOT NULL,
  period_end      TIMESTAMPTZ NOT NULL,
  bookings_count      INTEGER NOT NULL DEFAULT 0,
  ai_requests_count   INTEGER NOT NULL DEFAULT 0,
  api_calls_count     INTEGER NOT NULL DEFAULT 0,
  staff_count         INTEGER NOT NULL DEFAULT 0,
  locations_count     INTEGER NOT NULL DEFAULT 0,
  clients_count       INTEGER NOT NULL DEFAULT 0,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_org_period
  ON subscription_usage (organization_id, period_start DESC);

CREATE TABLE IF NOT EXISTS subscription_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID,
  event_type      TEXT NOT NULL,
  from_plan       TEXT,
  to_plan         TEXT,
  actor_id        TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscription_events_org
  ON subscription_events (organization_id, created_at DESC);

-- ── Step 6: Extend subscriptions table ───────────────────────────────────────
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan_id       UUID REFERENCES subscription_plans(id),
  ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end   TIMESTAMPTZ;

COMMIT;
