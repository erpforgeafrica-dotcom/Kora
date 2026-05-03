import "dotenv/config";

// Must be first — catches any module-level throws before logger is ready
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message, err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});
import { createApp } from "./app.js";
import { checkDatabaseHealth } from "./db/client.js";
import { logger } from "./shared/logger.js";
import { config } from "./config/environment.js";

const port = config.PORT;
const app = createApp();

let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;

async function initializeDatabase() {
  const health = await checkDatabaseHealth();
  if (!health.healthy) {
    throw new Error(`Database health check failed: ${health.details.error}`);
  }
  logger.info('Database connection verified', health.details);
}

async function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info('Graceful shutdown initiated', { signal });

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after 30 seconds');
      process.exit(1);
    }, 30000);
  }
}

async function start() {
  try {
    logger.info('🚀 Starting KORA server initialization...');
    
    logger.info('📊 Checking database health...');
    await initializeDatabase();
    logger.info('✅ Database health check passed');

    logger.info('🌐 Starting HTTP server...');
    server = app.listen(port, '0.0.0.0', () => {
      logger.info('🎉 KORA backend started successfully!', {
        port,
        environment: config.NODE_ENV,
        url: `http://localhost:${port}`
      });
    });

    logger.info('📡 Registering process handlers...');
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught exception', { error: err.message }, err);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled rejection', { reason: String(reason) });
      shutdown('unhandledRejection');
    });
    
    logger.info('✅ Server initialization complete');
  } catch (err) {
    logger.error('❌ Failed to start server', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('FATAL: Startup failed:', err);
  process.exit(1);
});
