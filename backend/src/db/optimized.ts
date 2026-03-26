import { Pool, type QueryResultRow } from "pg";
import { logger } from "../shared/logger.js";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://kora:kora@localhost:5432/kora";

// Optimized pool configuration
export const dbPool = new Pool({
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || "20", 10),
  min: parseInt(process.env.DB_POOL_MIN || "5", 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || "5000", 10),
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || "30000", 10),
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || "30000", 10),
});

// Pool event handlers
dbPool.on("error", (err) => {
  logger.error("Unexpected error on idle client", undefined, err instanceof Error ? err : new Error(String(err)));
});

dbPool.on("connect", () => {
  logger.debug("New database connection established");
});

dbPool.on("remove", () => {
  logger.debug("Database connection removed from pool");
});

// Query monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  rowCount: number;
  timestamp: Date;
}

const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || "1000", 10);
const queryMetrics: QueryMetrics[] = [];

export async function queryDb<T extends QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const startTime = Date.now();

  try {
    const result = await dbPool.query<T>(text, params);
    const duration = Date.now() - startTime;

    // Log slow queries
    if (duration > slowQueryThreshold) {
      logger.warn("Slow query detected", {
        query: text.substring(0, 100),
        duration,
        params: params.length,
      });
    }

    // Track metrics
    queryMetrics.push({
      query: text,
      duration,
      rowCount: result.rows.length,
      timestamp: new Date(),
    });

    // Keep only last 1000 metrics
    if (queryMetrics.length > 1000) {
      queryMetrics.shift();
    }

    return result.rows;
  } catch (error) {
    const duration = Date.now() - startTime;
    const reportedError = error instanceof Error ? error : new Error(String(error));
    logger.error("Query error", {
      query: text.substring(0, 100),
      duration,
    }, reportedError);
    throw error;
  }
}

// Get query metrics
export function getQueryMetrics() {
  const recent = queryMetrics.slice(-100);
  const avgDuration =
    recent.reduce((sum, m) => sum + m.duration, 0) / recent.length || 0;
  const slowQueries = recent.filter((m) => m.duration > slowQueryThreshold).length;

  return {
    totalQueries: queryMetrics.length,
    recentQueries: recent.length,
    averageDuration: Math.round(avgDuration),
    slowQueries,
    poolSize: dbPool.totalCount,
    idleCount: dbPool.idleCount,
    waitingCount: dbPool.waitingCount,
  };
}

// Graceful shutdown
export async function closeDbPool() {
  await dbPool.end();
  logger.info("Database pool closed");
}
