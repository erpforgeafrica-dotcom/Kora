/**
 * Production-ready structured logger for KÓRA backend
 * Provides JSON logging with correlation IDs and context
 */

interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class StructuredLogger {
  private logLevel: string;
  private isProduction: boolean;

  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.logLevel as keyof typeof levels] ?? 1;
    const messageLevel = levels[level as keyof typeof levels] ?? 1;
    return messageLevel >= currentLevel;
  }

  private formatLog(level: string, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (this.isProduction) {
      // JSON output for production log aggregation
      console.log(JSON.stringify(entry));
    } else {
      // Human-readable format for development
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      const errorStr = entry.error ? ` ERROR: ${entry.error.message}` : '';
      console.log(`[${entry.level}] ${entry.timestamp} ${entry.message}${contextStr}${errorStr}`);
      if (entry.error?.stack && !this.isProduction) {
        console.log(entry.error.stack);
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.output(this.formatLog('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.output(this.formatLog('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.output(this.formatLog('warn', message, context));
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog('error')) {
      this.output(this.formatLog('error', message, context, error));
    }
  }

  // Create child logger with persistent context
  child(persistentContext: LogContext): StructuredLogger {
    const childLogger = new StructuredLogger();
    const originalOutput = childLogger.output.bind(childLogger);
    
    childLogger.output = (entry: LogEntry) => {
      entry.context = { ...persistentContext, ...entry.context };
      originalOutput(entry);
    };
    
    return childLogger;
  }
}

export const logger = new StructuredLogger();

// Request-scoped logger factory
export function createRequestLogger(requestId: string, userId?: string, organizationId?: string): StructuredLogger {
  return logger.child({ requestId, userId, organizationId });
}