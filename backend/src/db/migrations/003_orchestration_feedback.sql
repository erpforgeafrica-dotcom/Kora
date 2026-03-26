create table if not exists ai_command_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  source_module text not null,
  title text not null,
  context text not null,
  severity text not null,
  dependencies jsonb not null default '[]'::jsonb,
  sla_risk numeric(5, 2) not null default 0,
  command_fingerprint text not null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  detected_at timestamptz not null default now()
);

create index if not exists idx_ai_cmd_candidates_org_detected
  on ai_command_candidates(organization_id, detected_at desc);
create index if not exists idx_ai_cmd_candidates_fingerprint
  on ai_command_candidates(command_fingerprint);

create table if not exists ai_action_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid null references users(id) on delete set null,
  action_id text not null,
  command_fingerprint text not null,
  outcome text not null check (outcome in ('accepted', 'rejected', 'executed', 'ignored')),
  feedback_score int not null default 0 check (feedback_score between -1 and 1),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_feedback_org_created
  on ai_action_feedback(organization_id, created_at desc);
create index if not exists idx_ai_feedback_fingerprint
  on ai_action_feedback(command_fingerprint);

create table if not exists ai_orchestration_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid null references users(id) on delete set null,
  context jsonb not null,
  snapshot jsonb not null,
  prioritized_actions jsonb not null,
  policy_outcomes jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_orch_events_org_created
  on ai_orchestration_events(organization_id, created_at desc);
