alter table services
  add column if not exists slug text,
  add column if not exists tags text[] default '{}',
  add column if not exists min_price numeric(10,2),
  add column if not exists max_price numeric(10,2),
  add column if not exists image_url text,
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored;

create unique index if not exists idx_services_slug
  on services(slug)
  where slug is not null;

create index if not exists idx_services_search
  on services using gin(search_vector);

create index if not exists idx_services_category_active
  on services(category_id, is_active);

create table if not exists venue_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid unique not null references organizations(id) on delete cascade,
  display_name text not null,
  slug text unique not null,
  tagline text,
  description text,
  cover_image_url text,
  logo_url text,
  address_line1 text,
  city text,
  postcode text,
  country text default 'GB',
  lat numeric(9,6),
  lng numeric(9,6),
  phone text,
  email text,
  rating numeric(3,2) default 0,
  review_count integer default 0,
  is_published boolean default false,
  features text[] default '{}',
  opens_at time,
  closes_at time,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_venue_profiles_city
  on venue_profiles(city);

create index if not exists idx_venue_profiles_published
  on venue_profiles(is_published, city);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  booking_id uuid references bookings(id) on delete set null,
  staff_member_id uuid references staff_members(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  body text,
  is_verified boolean default false,
  is_published boolean default true,
  ai_sentiment text check (ai_sentiment in ('positive', 'neutral', 'negative')),
  created_at timestamptz default now(),
  unique (client_id, booking_id)
);

create index if not exists idx_reviews_org_created
  on reviews(organization_id, created_at desc);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text,
  type text not null check (type in ('pct_off', 'fixed_off', 'free_service', 'first_visit')),
  value numeric(10,2) not null,
  min_spend numeric(10,2) default 0,
  applicable_service_ids uuid[] default '{}',
  max_uses integer,
  uses_count integer default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create unique index if not exists idx_promotions_org_code
  on promotions(organization_id, code)
  where code is not null;
