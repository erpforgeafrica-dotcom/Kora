-- 020_projects_planning.sql
-- Projects, tasks, milestones for planning

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  description text,
  status text default 'active',
  start_date date,
  due_date date,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  organization_id uuid references organizations(id),
  title text not null,
  description text,
  status text default 'todo',
  priority text default 'medium',
  assigned_to uuid references users(id),
  due_date date,
  estimated_hours numeric(6,2),
  ai_estimated_hours numeric(6,2),
  created_at timestamptz default now()
);

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  due_date date,
  status text default 'pending',
  created_at timestamptz default now()
);
