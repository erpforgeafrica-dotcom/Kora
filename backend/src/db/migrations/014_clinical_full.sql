-- 014_clinical_full.sql
-- Clinical: patients, appointments, notes, lab orders, prescriptions, diagnoses

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  customer_id uuid references clients(id),
  patient_number text unique,
  blood_type text,
  allergies text[],
  current_medications text[],
  conditions text[],
  insurance_provider text,
  insurance_number text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz default now()
);

create table if not exists clinical_appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  patient_id uuid references patients(id),
  booking_id uuid references bookings(id),
  appointment_type text,
  chief_complaint text,
  diagnosis_codes text[],
  status text default 'scheduled',
  created_at timestamptz default now()
);

create table if not exists clinical_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references clinical_appointments(id),
  organization_id uuid references organizations(id),
  author_id uuid references staff_members(id),
  subjective text,
  objective text,
  assessment text,
  plan text,
  ai_draft text,
  ai_draft_accepted boolean default false,
  created_at timestamptz default now()
);

create table if not exists lab_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  patient_id uuid references patients(id),
  appointment_id uuid references clinical_appointments(id),
  test_names text[],
  status text default 'ordered',
  ordered_by uuid references staff_members(id),
  ordered_at timestamptz default now()
);

create table if not exists lab_results (
  id uuid primary key default gen_random_uuid(),
  lab_order_id uuid references lab_orders(id),
  test_name text,
  value text,
  unit text,
  reference_range text,
  flag text,
  resulted_at timestamptz default now()
);

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  patient_id uuid references patients(id),
  appointment_id uuid references clinical_appointments(id),
  prescribed_by uuid references staff_members(id),
  medication text not null,
  dosage text,
  frequency text,
  duration text,
  notes text,
  prescribed_at timestamptz default now()
);

create table if not exists diagnoses (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references clinical_appointments(id),
  patient_id uuid references patients(id),
  diagnosis_code text,
  description text,
  diagnosed_at timestamptz default now()
);
