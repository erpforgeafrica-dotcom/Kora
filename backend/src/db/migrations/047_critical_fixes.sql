-- Migration 047: Critical Platform Fixes (Audit Report Items 1-10)
-- Fixes: org enrichment, soft delete, indexes, delivery status, RLS, GDPR

-- ── FIX 1: Enrich organizations (was 3 columns) ──────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS slug          TEXT,
  ADD COLUMN IF NOT EXISTS status        TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS plan_id       TEXT,
  ADD COLUMN IF NOT EXISTS ai_plan       TEXT NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS timezone      TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS currency      TEXT NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS country       TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS city          TEXT,
  ADD COLUMN IF NOT EXISTS phone         TEXT,
  ADD COLUMN IF NOT EXISTS email         TEXT,
  ADD COLUMN IF NOT EXISTS logo_url      TEXT,
  ADD COLUMN IF NOT EXISTS website       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deleted_at    TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_slug
  ON organizations(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_status
  ON organizations(status) WHERE deleted_at IS NULL;

-- ── FIX 2: Soft delete on core entities ──────────────────────────────────────
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE staff_members
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- patients: HIPAA requires retention — use archived_at not deleted_at
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- ── FIX 3: Missing indexes on high-traffic patterns ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_org_time
  ON bookings(organization_id, start_time DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_org_status
  ON bookings(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_org_email
  ON clients(organization_id, email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clinical_appts_patient_status
  ON clinical_appointments(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_clinical_appts_org_created
  ON clinical_appointments(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_org_created
  ON transactions(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_org_status
  ON transactions(organization_id, status);

-- ── FIX 4: Delivery status mismatch ──────────────────────────────────────────
-- App state machine uses 'picked_up', DB had 'pickup_en_route' only
ALTER TABLE delivery_bookings
  DROP CONSTRAINT IF EXISTS delivery_bookings_status_check;
ALTER TABLE delivery_bookings
  ADD CONSTRAINT delivery_bookings_status_check
  CHECK (status IN ('pending','assigned','pickup_en_route','picked_up','in_transit','delivered','failed','cancelled','canceled'));

-- ── FIX 5: GDPR data export/erasure support ───────────────────────────────────
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  request_type    TEXT NOT NULL CHECK (request_type IN ('export','erasure','rectification')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','rejected')),
  requested_by    TEXT,
  completed_at    TIMESTAMPTZ,
  export_url      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_org
  ON gdpr_requests(organization_id, created_at DESC);

-- ── FIX 6: Onboarding tracking ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_progress (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  step_org_profile    BOOLEAN NOT NULL DEFAULT false,
  step_first_service  BOOLEAN NOT NULL DEFAULT false,
  step_first_staff    BOOLEAN NOT NULL DEFAULT false,
  step_first_booking  BOOLEAN NOT NULL DEFAULT false,
  step_payment_setup  BOOLEAN NOT NULL DEFAULT false,
  step_plan_selected  BOOLEAN NOT NULL DEFAULT false,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
