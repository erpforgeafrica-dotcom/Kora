#!/usr/bin/env node
/**
 * KORA Startup Validator
 * Checks all required configuration before starting the server.
 * Run: node scripts/start-check.js
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env");

const RED   = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

const errors   = [];
const warnings = [];
const ok       = [];

if (!existsSync(envPath)) {
  console.error(`${RED}❌ backend/.env not found. Copy .env.example and fill in values.${RESET}`);
  process.exit(1);
}

const env = {};
readFileSync(envPath, "utf8").split("\n").forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eq = trimmed.indexOf("=");
  if (eq === -1) return;
  env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
});

// ── Required checks ───────────────────────────────────────────────────────────

if (!env.DATABASE_URL) {
  errors.push("DATABASE_URL is not set");
} else if (env.DATABASE_URL.includes("YOUR_SUPABASE_DB_PASSWORD")) {
  errors.push("DATABASE_URL still has placeholder password — replace YOUR_SUPABASE_DB_PASSWORD");
} else if (env.DATABASE_URL.includes("localhost")) {
  warnings.push("DATABASE_URL points to localhost — make sure local Postgres is running");
  ok.push("DATABASE_URL set (local)");
} else {
  ok.push("DATABASE_URL set (Supabase)");
}

if (!env.CLERK_SECRET_KEY) {
  errors.push("CLERK_SECRET_KEY is not set");
} else if (env.CLERK_SECRET_KEY.includes("replace")) {
  errors.push("CLERK_SECRET_KEY still has placeholder value");
} else {
  ok.push("CLERK_SECRET_KEY set");
}

if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  errors.push("JWT_SECRET must be at least 32 characters");
} else {
  ok.push("JWT_SECRET set");
}

if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
  errors.push("SESSION_SECRET must be at least 32 characters");
} else {
  ok.push("SESSION_SECRET set");
}

// ── Warning checks ────────────────────────────────────────────────────────────

if (!env.CLERK_WEBHOOK_SECRET || env.CLERK_WEBHOOK_SECRET.includes("replace")) {
  warnings.push("CLERK_WEBHOOK_SECRET not set — Clerk webhooks will not work");
} else {
  ok.push("CLERK_WEBHOOK_SECRET set");
}

if (!env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET.includes("test_stripe_webhook")) {
  warnings.push("STRIPE_WEBHOOK_SECRET is placeholder — Stripe webhooks will not verify signatures");
} else {
  ok.push("STRIPE_WEBHOOK_SECRET set");
}

if (!env.REDIS_URL) {
  warnings.push("REDIS_URL not set — caching and queues will be disabled");
} else {
  ok.push("REDIS_URL set");
}

// ── Output ────────────────────────────────────────────────────────────────────

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║           KORA Startup Configuration Check           ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

ok.forEach(msg => console.log(`  ${GREEN}✓${RESET} ${msg}`));
warnings.forEach(msg => console.log(`  ${YELLOW}⚠${RESET}  ${msg}`));
errors.forEach(msg => console.log(`  ${RED}✗${RESET} ${msg}`));

console.log("");

if (errors.length > 0) {
  console.error(`${RED}❌ ${errors.length} error(s) must be fixed before starting.${RESET}\n`);
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn(`${YELLOW}⚠  ${warnings.length} warning(s) — server will start but some features may not work.${RESET}\n`);
}

if (errors.length === 0) {
  console.log(`${GREEN}✅ Configuration valid. Starting server...${RESET}\n`);
}
