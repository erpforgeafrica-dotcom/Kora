import { Redis } from "ioredis";
import { logger } from "./logger.js";

const FAILURE_THRESHOLD = 5;   // open after this many consecutive failures
const RECOVERY_MS       = 15_000; // try again after 15 s

interface CircuitState {
  failures: number;
  openedAt: number | null;
}

const circuits = new Map<string, CircuitState>();

function getState(name: string): CircuitState {
  if (!circuits.has(name)) circuits.set(name, { failures: 0, openedAt: null });
  return circuits.get(name)!;
}

export function isCircuitOpen(name: string): boolean {
  const s = getState(name);
  if (s.openedAt === null) return false;
  if (Date.now() - s.openedAt >= RECOVERY_MS) {
    // half-open: allow one probe
    s.openedAt = null;
    return false;
  }
  return true;
}

export function recordSuccess(name: string): void {
  const s = getState(name);
  s.failures = 0;
  s.openedAt = null;
}

export function recordFailure(name: string): void {
  const s = getState(name);
  s.failures++;
  if (s.failures >= FAILURE_THRESHOLD && s.openedAt === null) {
    s.openedAt = Date.now();
    logger.warn("Redis circuit opened", { circuit: name, failures: s.failures });
  }
}

/** Build a lazy Redis client that participates in the circuit breaker. */
export function makeLazyRedis(name: string): () => Redis | null {
  let client: Redis | null = null;
  return () => {
    if (!process.env.REDIS_URL) return null;
    if (isCircuitOpen(name)) return null;
    if (!client) {
      client = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableReadyCheck: false,
      });
      client.on("error", (err: Error) => {
        recordFailure(name);
        logger.error(`Redis error [${name}]`, { message: err.message });
      });
      client.on("ready", () => recordSuccess(name));
    }
    return client;
  };
}
