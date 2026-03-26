# KORA Deployment Infrastructure Quick Reference

## 📋 Command Cheat Sheet

### Development (Local)
```bash
# Start all services
docker-compose up -d

# Follow logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images
docker-compose build

# Run migrations
docker exec kora-backend npm run db:migrate

# Seed database
docker exec kora-backend npm run db:seed

# Run tests in container
docker exec kora-backend npm run test
```

---

### Staging Deployment
```bash
# Build and start
docker-compose -f docker-compose.staging.yml up -d

# Check status
docker-compose -f docker-compose.staging.yml ps

# Migrations
docker exec kora-backend-staging npm run db:migrate

# View logs
docker-compose -f docker-compose.staging.yml logs -f backend-staging

# Graceful shutdown
docker-compose -f docker-compose.staging.yml down
```

---

### Production Deployment
```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# Migrations
docker exec kora-backend-prod npm run db:migrate

# View logs (backend-1)
docker exec kora-backend-prod tail -f /var/log/kora/backend.log

# View logs (backend-2)
docker exec kora-backend-prod-2 tail -f /var/log/kora/backend.log

# Graceful shutdown
docker-compose -f docker-compose.prod.yml down --timeout 30
```

---

## 🔍 Health Checks

### Backend Health
```bash
# Development
curl http://localhost:3000/health

# Staging
curl https://api-staging.kora.app/health

# Production
curl https://api.kora.app/health
```

### Service Status
```bash
# All services
docker-compose ps

# Specific environment
docker-compose -f docker-compose.staging.yml ps
docker-compose -f docker-compose.prod.yml ps
```

---

## 🔐 Environment Setup

### Add Staging Credentials
```bash
# 1. Edit backend/.env.staging
DATABASE_URL=postgresql://kora_staging:SECURE_PASSWORD@postgres-staging:5432/kora_staging
REDIS_URL=redis://:REDIS_PASSWORD@redis-staging:6379
CLERK_SECRET_KEY=sk_test_xxxxx
ANTHROPIC_API_KEY=sk_ant_xxxxx
# ... other keys

# 2. Edit frontend/.env.staging
VITE_API_BASE_URL=https://api-staging.kora.app
```

### Add Production Credentials
```bash
# 1. Edit backend/.env.prod
DATABASE_URL=postgresql://kora_prod:PROD_SECURE_PASSWORD@kora-db-prod.internal:5432/kora_prod
REDIS_URL=redis://:PROD_REDIS_PASSWORD@redis-prod:6379
CLERK_SECRET_KEY=sk_live_xxxxx
ANTHROPIC_API_KEY=sk_ant_long_xxxxx
# ... other production keys

# 2. Edit frontend/.env.prod
VITE_API_BASE_URL=https://api.kora.app
```

---

## 📊 Database Operations

### Run Migrations
```bash
# Development
docker exec kora-backend npm run db:migrate

# Staging
docker exec kora-backend-staging npm run db:migrate

# Production
docker exec kora-backend-prod npm run db:migrate
```

### Backup Database
```bash
# Development backup
docker exec kora-postgres pg_dump -U kora kora > backups/dev-$(date +%Y%m%d-%H%M%S).sql

# Staging backup
docker exec kora-postgres-staging pg_dump -U kora_staging kora_staging > backups/staging-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
docker exec -i kora-postgres psql -U kora kora < backups/dev-20260314-120000.sql
```

### Connect to Database
```bash
# Development
docker exec -it kora-postgres psql -U kora -d kora

# Staging
docker exec -it kora-postgres-staging psql -U kora_staging -d kora_staging

# Then in psql:
# \dt                    - list tables
# \dt+ bookings          - details on bookings table
# SELECT COUNT(*) FROM bookings;   - count records
# \q                     - exit
```

---

## 🐳 Container Management

### Build Images
```bash
# Build all (dev)
docker-compose build

# Build specific (dev)
docker-compose build backend
docker-compose build frontend

# Build staging
docker-compose -f docker-compose.staging.yml build

# Build production
docker-compose -f docker-compose.prod.yml build

# Build with no cache
docker-compose build --no-cache
```

### Push to Registry
```bash
# Tag images
docker tag kora-backend:latest myregistry/kora-backend:1.0.0
docker tag kora-frontend:latest myregistry/kora-frontend:1.0.0

# Push to registry
docker push myregistry/kora-backend:1.0.0
docker push myregistry/kora-frontend:1.0.0
```

---

## 🔧 Debugging

### View Logs
```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since 10m backend
```

### Execute Commands in Container
```bash
# Backend bash shell
docker exec -it kora-backend bash

# Run npm command
docker exec kora-backend npm run ts-node src/scripts/checkDb.ts

# View environment vars
docker exec -it kora-backend env | grep DATABASE
```

### Inspect Container
```bash
# Get container info
docker inspect kora-backend

# Get health status
docker inspect kora-backend | grep -A 10 Health

# Get IP address
docker inspect kora-backend | grep IPAddress
```

---

## 📈 Performance Tuning

### Check Resource Usage
```bash
# All containers
docker stats

# Specific container
docker stats kora-backend

# Watch continuously
docker stats --no-stream=false
```

### Increase Limits (production)
Edit `docker-compose.prod.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '4'      # Increase CPU
      memory: 4G     # Increase memory
    reservations:
      cpus: '2'
      memory: 2G
```

---

## 🚀 Scaling

### Add Backend Instance (Production)
In `docker-compose.prod.yml`, duplicate backend-prod section:
```yaml
backend-prod-3:
  build:
    context: ./backend
    dockerfile: Dockerfile
  image: kora-backend:latest
  container_name: kora-backend-prod-3
  env_file: backend/.env.prod
  environment:
    NODE_ENV: production
    PORT: 3000
  ports:
    - "3004:3000"    # Different port
  depends_on:
    postgres-prod:
      condition: service_healthy
    redis-prod:
      condition: service_healthy
  # ... rest of config
```

Then restart:
```bash
docker-compose -f docker-compose.prod.yml up -d backend-prod-3
```

---

## 🆘 Common Issues & Fixes

### Port Already in Use
```bash
# If port 3000 is in use (change in docker-compose.yml)
ports:
  - "3001:3000"    # Changed from 3000:3000

# Then restart
docker-compose restart backend
```

### Database Connection Failed
```bash
# Check if postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Connect directly
docker exec -it kora-postgres psql -U kora
```

### Out of Memory
```bash
# Check usage
docker stats

# Increase Docker memory limit
# In Docker Desktop: Preferences → Resources → Memory

# Or check container limits
docker inspect kora-backend | grep Memory
```

### Stuck Container
```bash
# Stop and remove
docker-compose down

# Full cleanup (careful!)
docker-compose down -v    # Remove volumes too

# Start fresh
docker-compose up -d
```

---

## 📞 Support Commands

### Verify Setup
```bash
# Check all services running
docker-compose ps

# Verify backend health
curl http://localhost:3000/health

# Verify frontend accessible
curl http://localhost:5173

# Check database migrated
docker exec kora-backend npm run db:migrate -- --status
```

### Generate Support Info
```bash
# Collect system info
docker-compose ps > support.txt
docker stats --no-stream >> support.txt
docker-compose logs --tail=50 backend >> support.txt
docker-compose logs --tail=50 postgres >> support.txt

# Send support.txt to devops team
```

---

## 📚 File Locations

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Development configuration |
| `docker-compose.staging.yml` | Staging configuration |
| `docker-compose.prod.yml` | Production configuration |
| `backend/Dockerfile` | Backend image definition |
| `frontend/Dockerfile` | Frontend image definition |
| `backend/.env.example` | Backend env template |
| `backend/.env.staging` | Staging credentials |
| `backend/.env.prod` | Production credentials |
| `frontend/.env.staging` | Frontend staging config |
| `frontend/.env.prod` | Frontend production config |
| `scripts/init-staging.sql` | Staging database schema |
| `scripts/init-prod.sql` | Production database schema |

---

**Created**: March 14, 2026  
**Last Updated**: March 14, 2026  
**Status**: Production Ready ✅
