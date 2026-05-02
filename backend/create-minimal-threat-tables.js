/**
 * Minimal threat detection migration
 */
import "dotenv/config";
import { Client } from "pg";

async function createMinimalThreatTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000
  });

  try {
    await client.connect();
    console.log("✅ Connected to database");

    // Create essential threat detection tables
    const tables = [
      {
        name: "threat_events",
        sql: `
          CREATE TABLE IF NOT EXISTS threat_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL,
            user_id UUID,
            event_type VARCHAR(50) NOT NULL,
            source VARCHAR(50) NOT NULL,
            severity VARCHAR(20) NOT NULL,
            threat_score INTEGER DEFAULT 0,
            ip_address INET,
            user_agent TEXT,
            session_id UUID,
            request_id TEXT,
            metadata JSONB DEFAULT '{}'::JSONB,
            detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_threat_events_org_id ON threat_events(organization_id);
          CREATE INDEX IF NOT EXISTS idx_threat_events_detected_at ON threat_events(detected_at);
        `
      },
      {
        name: "threat_signals", 
        sql: `
          CREATE TABLE IF NOT EXISTS threat_signals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL,
            user_id UUID,
            signal_type VARCHAR(100) NOT NULL,
            severity VARCHAR(20) NOT NULL,
            combined_score INTEGER NOT NULL,
            event_ids UUID[] DEFAULT ARRAY[]::UUID[],
            detector_results JSONB DEFAULT '{}'::JSONB,
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            auto_response_taken VARCHAR(100),
            detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_threat_signals_org_id ON threat_signals(organization_id);
          CREATE INDEX IF NOT EXISTS idx_threat_signals_status ON threat_signals(status);
        `
      },
      {
        name: "ip_reputation",
        sql: `
          CREATE TABLE IF NOT EXISTS ip_reputation (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ip_address INET NOT NULL UNIQUE,
            risk_score INTEGER DEFAULT 0,
            failed_login_count INTEGER DEFAULT 0,
            blocked_until TIMESTAMPTZ,
            last_seen_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_ip_reputation_ip_address ON ip_reputation(ip_address);
        `
      },
      {
        name: "login_failures",
        sql: `
          CREATE TABLE IF NOT EXISTS login_failures (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            identifier TEXT NOT NULL,
            organization_id UUID,
            ip_address INET NOT NULL,
            user_agent TEXT,
            failure_reason VARCHAR(100),
            attempt_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_login_failures_ip_address ON login_failures(ip_address);
          CREATE INDEX IF NOT EXISTS idx_login_failures_attempt_timestamp ON login_failures(attempt_timestamp);
        `
      },
      {
        name: "threat_detectors",
        sql: `
          CREATE TABLE IF NOT EXISTS threat_detectors (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            detector_name VARCHAR(100) NOT NULL UNIQUE,
            display_name VARCHAR(100) NOT NULL,
            description TEXT,
            enabled BOOLEAN DEFAULT TRUE,
            risk_threshold INTEGER DEFAULT 70,
            auto_response_enabled BOOLEAN DEFAULT FALSE,
            auto_response_action VARCHAR(100),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `
      }
    ];

    for (const table of tables) {
      console.log(`Creating ${table.name}...`);
      await client.query(table.sql);
      console.log(`✅ ${table.name} created`);
    }

    // Record migration
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    
    await client.query(
      "INSERT INTO schema_migrations(id) VALUES($1) ON CONFLICT (id) DO NOTHING",
      ["050_threat_detection_minimal.sql"]
    );

    console.log("🎉 Minimal threat detection tables created successfully!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

createMinimalThreatTables()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));