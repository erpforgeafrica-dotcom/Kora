-- Migration 012: Full Loyalty System

CREATE TABLE IF NOT EXISTS loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  program_type TEXT DEFAULT 'points',
  points_per_currency DECIMAL(6,2) DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_points INT NOT NULL,
  max_points INT,
  benefits JSONB DEFAULT '{}',
  discount_pct DECIMAL(4,2) DEFAULT 0,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES loyalty_programs(id),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  points_cost INT NOT NULL,
  reward_type TEXT,
  reward_value DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  customer_id UUID REFERENCES clients(id),
  reward_id UUID REFERENCES loyalty_rewards(id),
  points_used INT NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  referrer_customer_id UUID REFERENCES clients(id),
  referred_customer_id UUID REFERENCES clients(id),
  referral_code TEXT UNIQUE,
  points_awarded INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
