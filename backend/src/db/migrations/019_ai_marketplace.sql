-- 019_ai_marketplace.sql
-- AI marketplace signals: lead scores, pricing signals, matches

create table if not exists ai_lead_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  lead_id uuid references leads(id),
  score int check (score between 0 and 100),
  demographic_score int,
  behavior_score int,
  engagement_score int,
  intent_score int,
  recommendation text,
  computed_at timestamptz default now(),
  unique (organization_id, lead_id)
);

create table if not exists ai_pricing_signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  service_id uuid references services(id),
  base_price_cents int,
  demand_multiplier numeric(4,2) default 1.0,
  suggested_price_cents int,
  demand_level text,
  valid_from timestamptz,
  valid_to timestamptz,
  generated_at timestamptz default now()
);

create table if not exists marketplace_matches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  customer_id uuid references clients(id),
  service_id uuid references services(id),
  matched_staff_id uuid references staff_members(id),
  match_score numeric(5,2),
  match_factors jsonb,
  was_booked boolean default false,
  created_at timestamptz default now()
);
