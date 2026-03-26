import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dbPool } from "./client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

/**
 * Database Migration System
 * 
 * Applies numbered migration files in order
 * Tracks applied migrations in schema_migrations table
 * Rolls back on any error (ACID transaction per migration)
 * 
 * Usage:
 *   npm run db:migrate           - Apply all pending migrations
 *   npm run migrate:status       - Show migration status
 */

async function ensureMigrationsTable() {
  await dbPool.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const rows = await dbPool.query<{ id: string }>("select id from schema_migrations");
  return new Set(rows.rows.map((r) => r.id));
}

async function applyMigration(fileName: string, sql: string) {
  const client = await dbPool.connect();
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into schema_migrations(id) values($1)", [fileName]);
    await client.query("commit");
    console.log(`✅ Applied: ${fileName}`);
  } catch (error) {
    await client.query("rollback");
    console.error(`❌ Failed: ${fileName}`);
    throw error;
  } finally {
    client.release();
  }
}

async function validateMigrationOrder(files: string[]) {
  // Check for gaps in numbering (optional warning)
  const numbers = files
    .map((f) => parseInt(f.split("_")[0]))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  for (let i = 0; i < numbers.length - 1; i++) {
    if (numbers[i + 1] - numbers[i] > 1) {
      console.warn(`⚠️  Gap in migration numbering: ${numbers[i]} -> ${numbers[i + 1]}`);
    }
  }
}

async function main() {
  console.log("\n📦 Running Database Migrations\n");

  try {
    await ensureMigrationsTable();
    const files = (await fs.readdir(migrationsDir))
      .filter((name) => name.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("No migration files found in migrations directory");
      return;
    }

    await validateMigrationOrder(files);

    const applied = await getAppliedMigrations();
    let count = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`⏭️  Skipped: ${file}`);
        continue;
      }

      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
      await applyMigration(file, sql);
      count++;
    }

    if (count === 0) {
      console.log("\nNo pending migrations to apply");
    } else {
      console.log(`\n✅ Successfully applied ${count} migration(s)`);
    }

    console.log("\nDatabase schema is up to date ✓\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

main()
  .then(async () => {
    await dbPool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Fatal error during migration:", error);
    await dbPool.end();
    process.exit(1);
  });
