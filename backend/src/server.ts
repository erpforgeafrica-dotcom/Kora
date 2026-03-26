import "dotenv/config";
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
    await initializeDatabase();

    server = app.listen(port, () => {
      logger.info('KORA backend started', {
        port,
        environment: config.NODE_ENV,
        url: `http://localhost:${port}`
      });
    });

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
  } catch (err) {
    logger.error('Failed to start server', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
  }
}

start().catch((err) => {
  logger.error('Startup failed', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
