CREATE TABLE IF NOT EXISTS organization_ai_settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    enable_anomalies BOOLEAN DEFAULT true,
    enable_auto_assignment BOOLEAN DEFAULT true,
    anomaly_sensitivity NUMERIC(4, 2) DEFAULT 2.00,
    similarity_cutoff NUMERIC(4, 2) DEFAULT 0.70,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
