-- Migration 045: Support Tickets module
-- Owner: Database Team
-- Locked: support_tickets, support_ticket_events, state machine enforced at app layer

CREATE TABLE IF NOT EXISTS support_tickets (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,
  customer_name       TEXT,
  channel             TEXT NOT NULL,
  event               TEXT NOT NULL DEFAULT 'manual_case',
  description         TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','assigned','in_progress','resolved','closed','escalated')),
  priority            TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','critical')),
  assignee_staff_id   UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  resolution_note     TEXT,
  resolved_at         TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org_status
  ON support_tickets (organization_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org_priority
  ON support_tickets (organization_id, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org_assignee
  ON support_tickets (organization_id, assignee_staff_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS support_ticket_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  support_ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  event_type          TEXT NOT NULL,
  actor_user_id       UUID,
  details             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_events_ticket_created
  ON support_ticket_events (support_ticket_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_ticket_events_org_created
  ON support_ticket_events (organization_id, created_at DESC);
