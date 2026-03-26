import { Pool, type QueryResultRow } from "pg";
import { config } from "../config/environment.js";
import { logger } from "../shared/logger.js";

const connectionString = config.DATABASE_URL;

export const dbPool = new Pool({
  connectionString,
  max: config.DB_POOL_MAX,
  min: config.DB_POOL_MIN,
  idleTimeoutMillis: config.DB_IDLE_TIMEOUT,
  connectionTimeoutMillis: config.DB_CONNECTION_TIMEOUT,
  statement_timeout: config.DB_STATEMENT_TIMEOUT,
  query_timeout: config.DB_STATEMENT_TIMEOUT,
  allowExitOnIdle: false,
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
