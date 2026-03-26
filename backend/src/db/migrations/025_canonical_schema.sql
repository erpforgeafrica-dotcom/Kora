-- Migration 025: Canonical Schema - Businesses, Subscriptions, Workflows
-- This migration introduces the single-source-of-truth tenant model and workflow infrastructure
-- Non-destructive: coexists with legacy schema

CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9_-]+$'),
  description TEXT,
  logo_url TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  county TEXT,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'GB' CHECK (country IN ('GB', 'US', 'AU', 'CA', 'IE')),
  lat NUMERIC(9,6),
  lng NUMERIC(9,6),
  phone TEXT,
  email TEXT,
  website TEXT,
  registration_number TEXT UNIQUE,
  tax_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending_activation' CHECK (
    status IN (
      'pending_activation',
      'active',
      'paused',
      'suspended',
      'archived'
    )
  ),
  subscription_plan_id UUID,
  subscription_activated_at TIMESTAMPTZ,
  subscription_next_billing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_owner ON businesses(owner_user_id, status);
CREATE INDEX idx_businesses_status ON businesses(status);

-- Workflow Definition: describes all possible states and transitions
CREATE TABLE IF NOT EXISTS workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('booking', 'subscription', 'service', 'business', 'staff_assignment')
  ),
  name TEXT NOT NULL,
  description TEXT,
  initial_state TEXT NOT NULL,
  terminal_states TEXT[] NOT NULL,
  transitions JSONB NOT NULL, -- {"pending": ["confirmed", "cancelled"], ...}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, name)
);

-- Workflow Instance: tracks current state of an entity
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE RESTRICT,
  current_state TEXT NOT NULL,
  previous_state TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX idx_workflow_instances_business_state ON workflow_instances(business_id, current_state);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(
  business_id, 
  entity_type, 
  current_state
) WHERE completed_at IS NULL;

-- Workflow Transitions: immutable audit trail of state changes
CREATE TABLE IF NOT EXISTS workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  triggered_by UUID NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_transitions_instance ON workflow_transitions(workflow_instance_id);
CREATE INDEX idx_workflow_transitions_audit ON workflow_transitions(
  workflow_instance_id,
  created_at DESC
);

-- Seeded Workflow Definitions (platform-wide definitions)
INSERT INTO workflow_definitions (
  entity_type, name, description, initial_state, terminal_states, transitions
) VALUES
  (
    'booking',
    'booking_lifecycle',
    'Standard booking state machine from creation to completion',
    'pending',
    ARRAY['completed', 'cancelled', 'no_show', 'failed'],
    '{"pending": ["confirmed", "cancelled"], "confirmed": ["checked_in", "cancelled"], "checked_in": ["in_progress", "no_show"], "in_progress": ["completed", "failed"], "failed": ["pending"], "cancelled": ["cancelled"], "no_show": ["no_show"], "completed": ["completed"]}'::jsonb
  ),
  (
    'subscription',
    'subscription_lifecycle',
    'Subscription activation, renewal, pause, and cancellation',
    'pending_payment',
    ARRAY['canceled', 'expired'],
    '{"pending_payment": ["active", "canceled"], "active": ["paused", "canceled", "past_due"], "paused": ["active", "canceled"], "past_due": ["active", "canceled"], "canceled": ["canceled"], "expired": ["expired"]}'::jsonb
  ),
  (
    'service',
    'service_publication',
    'Service visibility and availability lifecycle',
    'draft',
    ARRAY['archived'],
    '{"draft": ["active", "archived"], "active": ["paused", "archived"], "paused": ["active", "archived"], "archived": ["archived"]}'::jsonb
  ),
  (
    'business',
    'business_activation',
    'Business registration to operational status',
    'pending_activation',
    ARRAY['archived'],
    '{"pending_activation": ["active", "suspended", "archived"], "active": ["paused", "suspended", "archived"], "paused": ["active", "archived"], "suspended": ["suspended", "archived"], "archived": ["archived"]}'::jsonb
  )
ON CONFLICT (entity_type, name) DO NOTHING;

-- Update bookings table to link to workflow
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_start TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_end TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_workflow ON bookings(workflow_instance_id);
