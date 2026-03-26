alter table clients
  add column if not exists stripe_customer_id text;

create unique index if not exists idx_clients_stripe_customer_id
  on clients(stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  stripe_payment_method_id text unique not null,
  type text not null,
  brand text,
  last4 text,
  exp_month smallint,
  exp_year smallint,
  is_default boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_payment_methods_client
  on payment_methods(client_id, is_default desc, created_at desc);

create table if not exists refunds (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  stripe_refund_id text unique,
  amount numeric(10,2) not null,
  reason text check (reason in ('duplicate', 'fraudulent', 'requested_by_customer', 'service_not_provided')),
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  initiated_by uuid references staff_members(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_refunds_transaction
  on refunds(transaction_id, created_at desc);

alter table transactions
  add column if not exists stripe_payment_method_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists promotion_id uuid references promotions(id) on delete set null,
  add column if not exists discount_amount numeric(10,2) default 0,
  add column if not exists tip_amount numeric(10,2) default 0,
  add column if not exists receipt_url text,
  add column if not exists failure_code text,
  add column if not exists failure_message text;
