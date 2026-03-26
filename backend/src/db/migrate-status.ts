import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dbPool } from "./client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

/**
 * Show migration status - which migrations have been applied
 */
async function main() {
  try {
    // Ensure migrations table exists
    await dbPool.query(`
      create table if not exists schema_migrations (
        id text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    // Get applied migrations
    const appliedResult = await dbPool.query<{ id: string; applied_at: Date }>(
      `select id, applied_at from schema_migrations order by applied_at`
    );
    const appliedSet = new Set(appliedResult.rows.map((r) => r.id));

    // Get available migration files
    const files = (await fs.readdir(migrationsDir))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    console.log("\n📋 Migration Status\n");
    console.log("Available migrations:");
    console.log("-".repeat(60));

    let appliedCount = 0;
    let pendingCount = 0;

    for (const file of files) {
      const isApplied = appliedSet.has(file);
      const status = isApplied ? "✅ APPLIED" : "⏳ PENDING";
      const timestamp =
        appliedResult.rows.find((r) => r.id === file)?.applied_at?.toISOString().slice(0, 10) || "";

      console.log(`${status}  ${file}${timestamp ? ` (${timestamp})` : ""}`);

      if (isApplied) appliedCount++;
      else pendingCount++;
    }

    console.log("-".repeat(60));
    console.log(`\nTotal: ${files.length} migrations`);
    console.log(`Applied: ${appliedCount}`);
    console.log(`Pending: ${pendingCount}\n`);

    if (pendingCount > 0) {
      console.log("Run 'npm run db:migrate' to apply pending migrations\n");
    }
  } catch (error) {
    console.error("Migration status check failed:", error);
    process.exit(1);
  } finally {
    await dbPool.end();
  }
}

main();
