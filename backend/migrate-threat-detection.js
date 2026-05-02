/**
 * Direct migration for threat detection tables
 * Bypasses pool configuration issues
 */
import "dotenv/config";
import { Client } from "pg";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runThreatDetectionMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
    statement_timeout: 60000,
    query_timeout: 60000
  });

  try {
    console.log("🔗 Connecting to database...");
    await client.connect();
    console.log("✅ Connected successfully!");

    // Check if migration already applied
    try {
      const result = await client.query(`
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'threat_events' AND table_schema = 'public'
      `);
      
      if (result.rows.length > 0) {
        console.log("✅ Threat detection tables already exist!");
        return;
      }
    } catch (err) {
      // Table doesn't exist, continue with migration
    }

    console.log("📦 Applying threat detection migration...");

    // Read migration file
    const migrationPath = path.join(__dirname, "src", "db", "migrations", "050_threat_detection.sql");
    const migrationSQL = await fs.readFile(migrationPath, "utf8");

    // Apply migration
    await client.query("BEGIN");
    await client.query(migrationSQL);
    
    // Record migration
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `);
    
    await client.query(
      "INSERT INTO schema_migrations(id) VALUES($1) ON CONFLICT (id) DO NOTHING",
      ["050_threat_detection.sql"]
    );
    
    await client.query("COMMIT");
    
    console.log("✅ Threat detection migration applied successfully!");
    
    // Verify tables were created
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'threat_%' OR table_name LIKE '%_reputation' OR table_name LIKE 'login_failures'
      ORDER BY table_name
    `);
    
    console.log("✅ Created tables:", tables.rows.map(r => r.table_name).join(", "));
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("❌ Rollback failed:", rollbackError.message);
    }
    throw error;
  } finally {
    await client.end();
  }
}

runThreatDetectionMigration()
  .then(() => {
    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });