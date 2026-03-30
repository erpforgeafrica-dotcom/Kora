/**
 * Vitest global setup — runs before any test file is loaded.
 * Provides all required environment variables so the env validator
 * does not throw during test collection.
 */

// These are safe test-only values — never used in production.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://kora:kora_dev_password@localhost:5432/kora';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test_jwt_secret_minimum_64_chars_for_vitest_suite_compliance_ok';
process.env.SESSION_SECRET = 'test_session_secret_minimum_64_chars_for_vitest_suite_compliance';
process.env.CLERK_SECRET_KEY = 'test_clerk_secret_key_minimum_32_chars_vitest';
process.env.STRIPE_SECRET_KEY = 'sk_test_vitest_placeholder_key_minimum_32_chars';
process.env.ENABLE_MOCK_PAYMENTS = 'true';
process.env.SENTRY_DSN = '';
process.env.LOG_LEVEL = 'error'; // suppress logs during tests
process.env.PORT = '3000';
process.env.DB_POOL_MAX = '5';
process.env.DB_POOL_MIN = '1';
process.env.DB_IDLE_TIMEOUT = '10000';
process.env.DB_CONNECTION_TIMEOUT = '3000';
process.env.DB_STATEMENT_TIMEOUT = '10000';
