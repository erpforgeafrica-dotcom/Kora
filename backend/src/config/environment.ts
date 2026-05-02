import { logger } from "../shared/logger.js";

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  SESSION_SECRET: string;
  CLERK_SECRET_KEY: string;
  CLERK_AUTHORIZED_PARTIES: string[];
  CLERK_WEBHOOK_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SENTRY_DSN: string;
  LOG_LEVEL: string;
  DB_POOL_MAX: number;
  DB_POOL_MIN: number;
  DB_IDLE_TIMEOUT: number;
  DB_CONNECTION_TIMEOUT: number;
  DB_STATEMENT_TIMEOUT: number;
}

const REQUIRED_VARS = [
  "DATABASE_URL",
  "REDIS_URL",
  "JWT_SECRET",
  "SESSION_SECRET",
  "CLERK_SECRET_KEY",
] as const;

function req(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`STARTUP FAILED: ${name} is required but not set`);
  if ((name.includes("SECRET") || name.includes("KEY")) && v.length < 32) {
    throw new Error(`${name} must be at least 32 characters`);
  }
  // Allow test keys in production only for Clerk (Render free tier uses test keys)
  const isClerkKey = name === "CLERK_SECRET_KEY";
  if (process.env.NODE_ENV === "production" && !isClerkKey && v.toLowerCase().includes("test")) {
    throw new Error(`${name} contains 'test' but NODE_ENV is production`);
  }
  return v.trim();
}

function opt(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  if (isNaN(n) || n <= 0) throw new Error(`${name} must be a positive integer, got: ${v}`);
  return n;
}

export function validateEnvironment(): EnvironmentConfig {
  const isProduction = process.env.NODE_ENV === "production";
  logger.info("Validating environment", { NODE_ENV: process.env.NODE_ENV });

  for (const name of REQUIRED_VARS) {
    if (!process.env[name]?.trim()) {
      throw new Error(`STARTUP FAILED: Required env var ${name} is missing`);
    }
  }

  const config: EnvironmentConfig = {
    NODE_ENV:                  process.env.NODE_ENV || "development",
    PORT:                      num("PORT", 3000),
    DATABASE_URL:              req("DATABASE_URL"),
    REDIS_URL:                 req("REDIS_URL"),
    JWT_SECRET:                req("JWT_SECRET"),
    SESSION_SECRET:            req("SESSION_SECRET"),
    CLERK_SECRET_KEY:          req("CLERK_SECRET_KEY"),
    CLERK_AUTHORIZED_PARTIES:  opt("CLERK_AUTHORIZED_PARTIES", "http://localhost:5173")
                                 .split(",").map(s => s.trim()).filter(Boolean),
    CLERK_WEBHOOK_SECRET:      opt("CLERK_WEBHOOK_SECRET"),
    STRIPE_SECRET_KEY:         opt("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET:     opt("STRIPE_WEBHOOK_SECRET"),
    SENTRY_DSN:                opt("SENTRY_DSN"),
    LOG_LEVEL:                 opt("LOG_LEVEL", isProduction ? "info" : "debug"),
    DB_POOL_MAX:               num("DB_POOL_MAX", isProduction ? 25 : 10),
    DB_POOL_MIN:               num("DB_POOL_MIN", isProduction ? 5 : 2),
    DB_IDLE_TIMEOUT:           num("DB_IDLE_TIMEOUT", 30000),
    DB_CONNECTION_TIMEOUT:     num("DB_CONNECTION_TIMEOUT", 5000),
    DB_STATEMENT_TIMEOUT:      num("DB_STATEMENT_TIMEOUT", 30000),
  };

  logger.info("Environment validated", {
    NODE_ENV: config.NODE_ENV,
    PORT: config.PORT,
    clerk: true,
    stripe: Boolean(config.STRIPE_SECRET_KEY),
    sentry: Boolean(config.SENTRY_DSN),
  });

  return config;
}

export const config = validateEnvironment();
