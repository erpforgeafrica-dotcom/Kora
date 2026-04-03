import { logger } from "../shared/logger.js";

interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_SECRET: string;
  SESSION_SECRET: string;
  SENTRY_DSN: string;
  CLERK_SECRET_KEY: string;
  STRIPE_SECRET_KEY: string;
  LOG_LEVEL: string;
  DB_POOL_MAX: number;
  DB_POOL_MIN: number;
  DB_IDLE_TIMEOUT: number;
  DB_CONNECTION_TIMEOUT: number;
  DB_STATEMENT_TIMEOUT: number;
}

const REQUIRED_VARS = [
  'DATABASE_URL',
  'REDIS_URL', 
  'JWT_SECRET',
  'SESSION_SECRET'
] as const;

function validateEnvironmentVariable(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${name} is required but not set`);
  }
  
  // Security validations
  if (name.includes('SECRET') || name.includes('KEY')) {
    if (value.length < 32) {
      throw new Error(`Environment variable ${name} must be at least 32 characters long`);
    }
    
    // Prevent test keys in production
    if (process.env.NODE_ENV === 'production' && value.includes('test')) {
      throw new Error(`Environment variable ${name} contains 'test' but NODE_ENV is production`);
    }
  }
  
  return value.trim();
}

function validateOptionalEnvironmentVariable(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    return '';
  }

  return validateEnvironmentVariable(name, value);
}

function validateNumericEnvironmentVariable(name: string, value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer, got: ${value}`);
  }
  
  return parsed;
}

export function validateEnvironment(): EnvironmentConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  logger.info('Validating environment configuration', { 
    NODE_ENV: process.env.NODE_ENV,
    isProduction 
  });
  
  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      throw new Error(`STARTUP FAILED: Required environment variable ${varName} is missing or empty`);
    }
  }
  
  try {
    const config: EnvironmentConfig = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: validateNumericEnvironmentVariable('PORT', process.env.PORT, 3000),
      DATABASE_URL: validateEnvironmentVariable('DATABASE_URL', process.env.DATABASE_URL),
      REDIS_URL: validateEnvironmentVariable('REDIS_URL', process.env.REDIS_URL),
      JWT_SECRET: validateEnvironmentVariable('JWT_SECRET', process.env.JWT_SECRET),
      SESSION_SECRET: validateEnvironmentVariable('SESSION_SECRET', process.env.SESSION_SECRET),
      SENTRY_DSN: validateOptionalEnvironmentVariable('SENTRY_DSN', process.env.SENTRY_DSN),
      CLERK_SECRET_KEY: validateOptionalEnvironmentVariable('CLERK_SECRET_KEY', process.env.CLERK_SECRET_KEY),
      STRIPE_SECRET_KEY: validateOptionalEnvironmentVariable('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY),
      LOG_LEVEL: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
      DB_POOL_MAX: validateNumericEnvironmentVariable('DB_POOL_MAX', process.env.DB_POOL_MAX, isProduction ? 25 : 10),
      DB_POOL_MIN: validateNumericEnvironmentVariable('DB_POOL_MIN', process.env.DB_POOL_MIN, isProduction ? 5 : 2),
      DB_IDLE_TIMEOUT: validateNumericEnvironmentVariable('DB_IDLE_TIMEOUT', process.env.DB_IDLE_TIMEOUT, 30000),
      DB_CONNECTION_TIMEOUT: validateNumericEnvironmentVariable('DB_CONNECTION_TIMEOUT', process.env.DB_CONNECTION_TIMEOUT, 5000),
      DB_STATEMENT_TIMEOUT: validateNumericEnvironmentVariable('DB_STATEMENT_TIMEOUT', process.env.DB_STATEMENT_TIMEOUT, 30000),
    };
    
    logger.info('Environment validation successful', {
      NODE_ENV: config.NODE_ENV,
      PORT: config.PORT,
      DB_POOL_MAX: config.DB_POOL_MAX,
      LOG_LEVEL: config.LOG_LEVEL,
      optionalIntegrations: {
        clerk: Boolean(config.CLERK_SECRET_KEY),
        sentry: Boolean(config.SENTRY_DSN),
        stripe: Boolean(config.STRIPE_SECRET_KEY)
      }
    });
    
    return config;
  } catch (error) {
    logger.error('Environment validation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

// Global config instance
export const config = validateEnvironment();
