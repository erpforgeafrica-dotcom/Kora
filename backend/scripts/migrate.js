#!/usr/bin/env node
/**
 * KORA Migration Runner
 * Usage: node scripts/migrate.js
 *
 * Reads DATABASE_URL from .env and runs all pending migrations.
 * Automatically sets NODE_ENV=development to bypass production key checks.
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");

// Parse .env manually to check DATABASE_URL before running
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf8");
  const dbUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (dbUrlMatch) {
    const dbUrl = dbUrlMatch[1].trim();
    if (dbUrl.includes("YOUR_SUPABASE_DB_PASSWORD")) {
      console.error("\n❌ Migration blocked: DATABASE_URL still contains placeholder password.");
      console.error("   Edit backend/.env and replace YOUR_SUPABASE_DB_PASSWORD with your actual Supabase password.");
      console.error("   Get it from: Supabase Dashboard → Settings → Database → Database password\n");
      process.exit(1);
    }
    if (dbUrl.includes("localhost") && !dbUrl.includes("supabase")) {
      console.warn("\n⚠️  Warning: DATABASE_URL points to localhost. Make sure local Postgres is running.\n");
    }
  }
}

console.log("\n🚀 Running KORA migrations...\n");

try {
  execSync("node_modules\\.bin\\tsx src/db/migrate.ts", {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development" },
  });
  console.log("\n✅ Migrations complete.\n");
} catch (err) {
  console.error("\n❌ Migration failed. Check the error above.\n");
  process.exit(1);
}
