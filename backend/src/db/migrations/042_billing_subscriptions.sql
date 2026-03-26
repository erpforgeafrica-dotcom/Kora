CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    service_id UUID NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'basic',
    current_state VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    billing_cycle_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    billing_cycle_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    payment_method_id VARCHAR(255),
    failed_payment_attempts INT NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    provider_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for speedy queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_client_id ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_state ON subscriptions(current_state);
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_cycle ON subscriptions(organization_id, billing_cycle_start, billing_cycle_end);
