import { Pool, type QueryResultRow } from "pg";
import { config } from "../config/environment.js";
import { logger } from "../shared/logger.js";

/**
 * Build database connection string from environment
 * 
 * Priority:
 * 1. DATABASE_URL (standard, used by most platforms)
 * 2. Individual vars (PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE) - used by Railway PostgreSQL plugin
 * 3. Fallback: throw error
 */
function buildConnectionString(): string {
  // Check for standard DATABASE_URL first
  if (process.env.DATABASE_URL?.trim()) {
    logger.info('Using DATABASE_URL from environment');
    return process.env.DATABASE_URL.trim();
  }

  // Railway provides individual PostgreSQL variables
  const pgHost = process.env.PGHOST?.trim();
  const pgPort = process.env.PGPORT?.trim() || '5432';
  const pgUser = process.env.PGUSER?.trim();
  const pgPassword = process.env.PGPASSWORD?.trim();
  const pgDatabase = process.env.PGDATABASE?.trim();

  if (pgHost && pgUser && pgPassword && pgDatabase) {
    const url = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
    logger.info('Database connection string built from Railway environment variables', {
      host: pgHost,
      port: pgPort,
      user: pgUser,
      database: pgDatabase
    });
    return url;
  }

  // Detailed error message for debugging
  const missingVars = [];
  if (!pgHost) missingVars.push('PGHOST');
  if (!pgUser) missingVars.push('PGUSER');
  if (!pgPassword) missingVars.push('PGPASSWORD');
  if (!pgDatabase) missingVars.push('PGDATABASE');

  const errorMsg = `DATABASE_URL not set and missing Railway PostgreSQL variables: ${missingVars.join(', ')}. ` +
    'Please ensure Railway PostgreSQL plugin is connected or set DATABASE_URL environment variable.';
  
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

const connectionString = buildConnectionString();

export const dbPool = new Pool({
  connectionString,
  max: config.DB_POOL_MAX,
  min: config.DB_POOL_MIN,
  idleTimeoutMillis: config.DB_IDLE_TIMEOUT,
  connectionTimeoutMillis: config.DB_CONNECTION_TIMEOUT,
  statement_timeout: config.DB_STATEMENT_TIMEOUT,
  query_timeout: config.DB_STATEMENT_TIMEOUT,
  allowExitOnIdle: false,
  ssl: connectionString?.includes('supabase.com') ? {
    rejectUnauthorized: false
  } : true, // Enable SSL for all remote databases
});

// Pool event handlers for monitoring
dbPool.on('connect', (client) => {
  logger.debug('Database client connected', { 
    totalCount: dbPool.totalCount,
    idleCount: dbPool.idleCount,
    waitingCount: dbPool.waitingCount
  });
});

dbPool.on('error', (err, client) => {
  logger.error('Database pool error', { 
    error: err.message,
    totalCount: dbPool.totalCount,
    idleCount: dbPool.idleCount
  });
});

dbPool.on('remove', (client) => {
  logger.debug('Database client removed from pool', {
    totalCount: dbPool.totalCount,
    idleCount: dbPool.idleCount
  });
});

export async function queryDb<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []): Promise<T[]> {
  const startTime = Date.now();
  const queryId = Math.random().toString(36).substr(2, 9);
  
  try {
    logger.debug('Executing query', { queryId, text: text.substring(0, 100) });
    
    const result = await dbPool.query<T>(text, params);
    const duration = Date.now() - startTime;
    
    // Log slow queries
    if (duration > 500) {
      logger.warn('Slow query detected', {
        queryId,
        duration,
        text: text.substring(0, 200),
        rowCount: result.rowCount
      });
    } else {
      logger.debug('Query completed', {
        queryId,
        duration,
        rowCount: result.rowCount
      });
    }
    
    return result.rows;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Query failed', {
      queryId,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
      text: text.substring(0, 200),
      params: params.length
    });
    throw error;
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; details: any }> {
  try {
    const startTime = Date.now();
    const result = await dbPool.query('SELECT 1 as health_check');
    const duration = Date.now() - startTime;
    
    return {
      healthy: true,
      details: {
        responseTime: duration,
        totalConnections: dbPool.totalCount,
        idleConnections: dbPool.idleCount,
        waitingConnections: dbPool.waitingCount
      }
    };
  } catch (error) {
    return {
      healthy: false,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        totalConnections: dbPool.totalCount,
        idleConnections: dbPool.idleCount
      }
    };
  }
}
