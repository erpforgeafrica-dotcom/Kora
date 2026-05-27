#!/bin/sh
# KORA Backend Startup Script
# Runs migrations with error handling, then starts the server

set -e  # Exit on any error

# Ensure PORT is set
PORT=${PORT:-3000}
echo "🚀 KORA Backend Starting (PORT=$PORT)"

# Log environment for debugging
echo "📋 Environment Check:"
echo "  NODE_ENV: ${NODE_ENV:-development}"
echo "  PORT: $PORT"
echo "  Has DATABASE_URL: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO')"
echo "  Has PGHOST: $([ -n "$PGHOST" ] && echo 'YES' || echo 'NO')"
echo "  Has PGUSER: $([ -n "$PGUSER" ] && echo 'YES' || echo 'NO')"
echo "  Has PGDATABASE: $([ -n "$PGDATABASE" ] && echo 'YES' || echo 'NO')"
echo "  Has REDIS_URL: $([ -n "$REDIS_URL" ] && echo 'YES' || echo 'NO')"

# Validate critical variables
if [ -z "$JWT_SECRET" ]; then
  echo "❌ FATAL: JWT_SECRET not set"
  exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "❌ FATAL: SESSION_SECRET not set"
  exit 1
fi

if [ -z "$CLERK_SECRET_KEY" ]; then
  echo "❌ FATAL: CLERK_SECRET_KEY not set"
  exit 1
fi

# Check database connectivity
if [ -n "$PGHOST" ] || [ -n "$DATABASE_URL" ]; then
  echo "📦 Testing Database Connection..."
  if node -e "
    const pg = require('pg');
    const Pool = pg.Pool;
    let connStr;
    
    if (process.env.DATABASE_URL) {
      connStr = process.env.DATABASE_URL;
    } else {
      connStr = \`postgresql://\${process.env.PGUSER}:\${process.env.PGPASSWORD}@\${process.env.PGHOST}:\${process.env.PGPORT || 5432}/\${process.env.PGDATABASE}\`;
    }
    
    const pool = new Pool({ connectionString: connStr });
    pool.query('SELECT 1')
      .then(() => {
        console.log('✅ Database connection OK');
        pool.end();
      })
      .catch(err => {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
      });
  " 2>&1; then
    :
  else
    echo "⚠️  Database connection test failed - proceeding anyway"
  fi
else
  echo "⚠️  No database configuration found (DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE)"
fi

# Run migrations
echo "🔄 Running Database Migrations..."
if node dist/db/migrate.js; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migrations failed - but continuing startup anyway"
  # Don't exit - let the server start and handle it
fi

# Start server
echo "🌐 Starting HTTP Server..."
node dist/server.js
