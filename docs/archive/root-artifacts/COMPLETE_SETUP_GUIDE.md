# KORA Complete Setup Guide (Development → Production)

## 🎯 Overview

This guide walks through **complete KORA setup** from development through production deployment, including:
- Docker containerization (3 environments)
- Database migrations
- Data seeding
- Health checks
- Graceful shutdown
- Monitoring

---

## 📋 Setup Workflow

### Phase 1: Development Environment (Local)

#### 1.1 Prerequisites
```bash
# Required:
- Docker & Docker Compose
- Node.js 20+
- npm 9+
- Git

# Check versions:
docker --version    # >= 20.10
node --version      # >= 20.0
npm --version       # >= 9.0
```

#### 1.2 Clone & Install
```bash
# Clone repository
git clone <repo> KORA
cd KORA

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Back to root
cd ..
```

#### 1.3 Environment Configuration
```bash
# Create development env file
cp backend/.env.example backend/.env

# Default content (already set):
# PORT=3000
# DATABASE_URL=postgresql://kora:kora@localhost:5432/kora
# REDIS_URL=redis://localhost:6379
# CLERK_SECRET_KEY=sk_test_xxx (add your key)

# Frontend env is optional for dev
# cp frontend/.env.example frontend/.env
```

#### 1.4 Start Services
```bash
# From root directory
docker-compose up -d

# Verify all running
docker-compose ps
# Expected output:
# kora-postgres    postgres:16-alpine    √ (healthy)
# kora-redis       redis:7-alpine        √ (healthy)
# kora-backend     node:20-alpine        √ (healthy)
# kora-worker      node:20-alpine        √ (healthy)
# kora-frontend    node:20-alpine        √ (healthy)
```

#### 1.5 Database Setup
```bash
# Run migrations
cd backend
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Seed demo data
npm run db:seed

# Back to root
cd ..
```

#### 1.6 Verify Development Environment
```bash
# Backend health check
curl http://localhost:3000/health
# Response: { "status": "ok", "service": "kora-backend", "timestamp": "..." }

# Frontend
open http://localhost:5173
# Or: curl http://localhost:5173

# API endpoint test
curl http://localhost:3000/api/businesses
# Response: Array of businesses
```

#### 1.7 Monitor Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 50 lines
docker-compose logs --tail=50 backend
```

**Development Ready ✅**

---

### Phase 2: Staging Environment (Pre-Production)

#### 2.1 Prerequisites
- Staging server (AWS EC2, GCP Compute, Azure VM, etc.)
- PostgreSQL database (RDS, Cloud SQL, etc.)
- Redis cache (ElastiCache, Memorystore, etc.)
- SSL/TLS certificate

#### 2.2 Prepare Staging Server
```bash
# SSH into staging server
ssh ubuntu@staging.kora.app

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Verify
docker --version

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone KORA
git clone <repo> KORA
cd KORA
```

#### 2.3 Configure Staging Environment
```bash
# Edit backend staging config
vi backend/.env.staging

# Required values for staging:
DATABASE_URL=postgresql://kora_staging:secure_pass@rds-staging.region.rds.amazonaws.com:5432/kora_staging
REDIS_URL=redis://:redis_pass@redis-staging.region.cache.amazonaws.com:6379
CLERK_SECRET_KEY=sk_test_staging_key_xxx
NODE_ENV=staging
LOG_LEVEL=info

# Edit frontend staging config
vi frontend/.env.staging

# Required values:
VITE_API_BASE_URL=https://api-staging.kora.app
VITE_ENVIRONMENT=staging
```

#### 2.4 Deploy to Staging
```bash
# Build images
docker-compose -f docker-compose.staging.yml build

# Start services
docker-compose -f docker-compose.staging.yml up -d

# Check status
docker-compose -f docker-compose.staging.yml ps

# Monitor startup
docker-compose -f docker-compose.staging.yml logs -f
```

#### 2.5 Database Setup (Staging)
```bash
# Run migrations inside container
docker exec kora-backend-staging npm run db:migrate

# Check migration status
docker exec kora-backend-staging npm run db:migrate:status

# Seed demo data for testing
docker exec kora-backend-staging npm run db:seed
```

#### 2.6 Verify Staging Deployment
```bash
# Check container health (from staging server)
docker-compose -f docker-compose.staging.yml ps

# Health endpoint
curl https://api-staging.kora.app/health

# List businesses
curl https://api-staging.kora.app/api/businesses

# Frontend
open https://staging.kora.app
```

#### 2.7 Setup Monitoring (Staging)
```bash
# View logs
docker-compose -f docker-compose.staging.yml logs -f backend-staging

# Resource usage
docker stats

# Database diagnostics
docker exec kora-postgres-staging psql \
  -U kora_staging -d kora_staging \
  -c "select count(*) from schema_migrations"
```

**Staging Ready ✅**

---

### Phase 3: Production Environment (Live)

#### 3.1 Prerequisites
- Production server infrastructure (Kubernetes or managed container service)
- Production PostgreSQL (AWS RDS, Azure Database, Google Cloud SQL)
- Production Redis (AWS ElastiCache, Azure Cache, etc.)
- SSL/TLS certificate (Let's Encrypt, AWS Certificate Manager)
- Load balancer / reverse proxy (ALB, Azure LB, nginx)
- Monitoring & logging (CloudWatch, Stackdriver, ELK)
- Backup strategy (daily snapshots)

#### 3.2 Prepare Production Environment

**Option A: Single Server (Not Recommended)**
```bash
# Only for small deployments (<1000 users)
ssh ubuntu@api.kora.app

# Install Docker, configure (same as staging)
# Note: Should use managed database services in production
```

**Option B: Kubernetes (Recommended)**
```bash
# Deploy to EKS / GKE / AKS
kubectl apply -f kora-deployment.yaml

# Verify
kubectl get pods
kubectl get services
```

#### 3.3 Configure Production Environment
```bash
# NEVER commit .env files - use secrets manager

# AWS Secrets Manager
aws secretsmanager create-secret \
  --name kora/prod/database-url \
  --secret-string "postgresql://kora_prod:secure_password@rds-prod.internal:5432/kora_prod"

# Or Azure Key Vault
az keyvault secret set --vault-name kora-vault \
  --name database-url \
  --value "postgresql://..."

# Docker Compose: reference via environment variables
# DATABASE_URL=${DATABASE_URL}  # Set via CI/CD or secrets manager
```

#### 3.4 Build Production Images
```bash
# On CI/CD server (GitHub Actions, GitLab CI, etc.)

# Build images
docker-compose -f docker-compose.prod.yml build

# Tag for registry
docker tag kora-backend:latest us-east-1.dkr.ecr.amazonaws.com/kora-backend:1.0.0
docker tag kora-frontend:latest us-east-1.dkr.ecr.amazonaws.com/kora-frontend:1.0.0

# Push to registry
docker push us-east-1.dkr.ecr.amazonaws.com/kora-backend:1.0.0
docker push us-east-1.dkr.ecr.amazonaws.com/kora-frontend:1.0.0
```

#### 3.5 Deploy to Production
```bash
# Option A: Docker Compose (small deployments)
docker-compose -f docker-compose.prod.yml up -d

# Option B: Kubernetes (recommended)
kubectl apply -f kora-deployment.yaml
kubectl rollout status deployment/kora-backend

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
kubectl get pods -o wide
```

#### 3.6 Database Setup (Production)
```bash
# Run migrations (CRITICAL - backup first!)
# Backup before migration
docker exec kora-postgres-prod pg_dump -U kora_prod kora_prod > backup-pre-2026-03-14.sql

# Run migrations
docker exec kora-backend-prod npm run db:migrate

# Verify
docker exec kora-backend-prod npm run db:migrate:status

# ⚠️ DO NOT SEED PRODUCTION
# Production data is created through normal API usage
```

#### 3.7 Verify Production Deployment
```bash
# Health check
curl https://api.kora.app/health
# Should return: { "status": "ok", "service": "kora-backend" }

# Test API endpoint
curl https://api.kora.app/api/businesses

# Frontend
open https://kora.app

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f backend-prod

# Check services health
docker-compose -f docker-compose.prod.yml ps
```

#### 3.8 Setup Production Monitoring
```bash
# Enable CloudWatch / Stackdriver logging
# Verify metrics being collected

# Set up alerts:
# - High error rate (> 1%)
# - High latency (> 1s)
# - Database connection pool exhaustion
# - Memory usage > 80%
# - Disk space < 10%
```

**Production Ready ✅**

---

## 🔄 Common Operations

### Restart Services (All Environments)
```bash
# Development
docker-compose restart

# Staging
docker-compose -f docker-compose.staging.yml restart

# Production
docker-compose -f docker-compose.prod.yml restart
```

### View Logs
```bash
# Follow all
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last N lines
docker-compose logs --tail=100 backend
```

### Update Code (Development)
```bash
# Backend changes auto-reload (tsx watch)
git pull
# Code changes apply immediately

# Frontend changes auto-reload (Vite)
git pull
# Changes apply immediately
```

### Graceful Shutdown
```bash
# Safe shutdown (30 second grace period)
docker-compose down

# With timeout
docker-compose down --timeout 30

# Production rolling update
kubectl set image deployment/kora-backend \
  kora-backend=us-east-1.dkr.ecr.amazonaws.com/kora-backend:1.0.1
```

### Database Backup
```bash
# Development
docker exec kora-postgres pg_dump -U kora kora > backup.sql

# Restore
docker exec -i kora-postgres psql -U kora kora < backup.sql
```

---

## 📊 Performance Tuning

### Database (Production)
```bash
# Check connection count
docker exec kora-postgres psql -U kora kora -c \
  "select datname, count(*) from pg_stat_activity group by datname"

# Analyze slow queries
docker exec kora-postgres psql -U kora kora -c \
  "select query, mean_exec_time from pg_stat_statements order by mean_exec_time desc limit 10"
```

### Redis Cache (Production)
```bash
# Check memory usage
docker exec kora-redis redis-cli info memory

# Monitor keys
docker exec kora-redis redis-cli keys "*" | wc -l

# Check eviction policy
docker exec kora-redis redis-cli config get maxmemory-policy
```

### Container Resources
```bash
# Check actual usage
docker stats

# Adjust in docker-compose.prod.yml if needed:
# deploy:
#   resources:
#     limits:
#       cpus: '4'
#       memory: 4G
```

---

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready: wait 10 seconds
# 2. PORT already in use: change in docker-compose.yml
# 3. Missing env variables: check .env file
# 4. Database connection failed: verify DATABASE_URL
```

### Migration Failed
```bash
# Check error
docker exec kora-backend npm run db:migrate 2>&1

# Rollback (restore from backup if needed)
docker exec -i kora-postgres psql -U kora kora < backup.sql

# Fix migration SQL
vi backend/src/db/migrations/NNN_name.sql

# Retry
npm run db:migrate
```

### High Error Rate in Production
```bash
# Check logs for errors
docker-compose -f docker-compose.prod.yml logs backend-prod | grep ERROR

# Check health endpoints
curl https://api.kora.app/health

# Check database
docker exec kora-postgres-prod psql -U kora_prod kora_prod -c "select 1"

# Restart if needed
docker-compose -f docker-compose.prod.yml restart backend-prod
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All code merged to main
- [ ] Tests passing locally
- [ ] Migrations tested on dev
- [ ] .env files configured correctly
- [ ] Database backup created
- [ ] Monitoring alerts set up
- [ ] Load balancer configured
- [ ] SSL certificate installed
- [ ] Team notified

### During Deployment
- [ ] Monitor logs during deployment
- [ ] Verify health checks passing
- [ ] Test key API endpoints
- [ ] Check database migrations applied
- [ ] Monitor error rates

### Post-Deployment
- [ ] Verify all services healthy
- [ ] Run smoke tests
- [ ] Check monitoring dashboards
- [ ] Document any issues
- [ ] Prepare rollback if needed
- [ ] Update status page

---

## 📞 Support

### Getting Help
1. **Development Issues**: Check logs (`docker-compose logs -f`)
2. **Staging Issues**: SSH into staging server, follow same steps
3. **Production Issues**: Check monitoring dashboard, then follow logs
4. **Database Issues**: Run `docker exec ... psql` to inspect schema
5. **Documentation**: Refer to DEPLOYMENT_AND_SCALING_GUIDE.md and DATABASE_MIGRATIONS_AND_SEEDING.md

### Resources
- [DEPLOYMENT_AND_SCALING_GUIDE.md](DEPLOYMENT_AND_SCALING_GUIDE.md) - Detailed deployment info
- [DATABASE_MIGRATIONS_AND_SEEDING.md](DATABASE_MIGRATIONS_AND_SEEDING.md) - Migration & seeding details
- [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md) - Command cheat sheet
- [DEPLOYMENT_ARCHITECTURE_COMPLETE.md](DEPLOYMENT_ARCHITECTURE_COMPLETE.md) - Technical deep-dive

---

**Complete Setup Guide v1.0**  
**Last Updated**: March 14, 2026  
**Status**: Production Ready ✅
