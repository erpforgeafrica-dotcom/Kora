# KORA Deployment & Scaling Guide

## 🎯 Overview

This guide covers containerization, environment setup, and deployment for KORA across development, staging, and production environments.

---

## 📦 What's Been Set Up

### 1. **Docker Images**
- ✅ **backend/Dockerfile**: Production-ready multi-stage build
  - Optimizes layer caching
  - Non-root user for security
  - Health checks enabled
  - Graceful shutdown handling
  
- ✅ **frontend/Dockerfile**: Optimized React build
  - Multi-stage build for minimal final image
  - Serves static files efficiently
  - Health checks enabled

### 2. **Environment Configuration**
- ✅ **backend/.env.example**: Development template
- ✅ **backend/.env.staging**: Staging configuration
- ✅ **backend/.env.prod**: Production configuration
- ✅ **frontend/.env.example**: Frontend development
- ✅ **frontend/.env.staging**: Frontend staging
- ✅ **frontend/.env.prod**: Frontend production

### 3. **Docker Compose Files**
- ✅ **docker-compose.yml**: Development (default)
- ✅ **docker-compose.staging.yml**: Staging environment
- ✅ **docker-compose.prod.yml**: Production environment

### 4. **Database Initialization**
- ✅ **scripts/init-staging.sql**: Staging schema setup
- ✅ **scripts/init-prod.sql**: Production schema with partitioning

### 5. **Graceful Shutdown**
- ✅ **backend/src/server.ts**: Graceful shutdown handler
  - Handles SIGTERM/SIGINT signals
  - 30-second grace period for in-flight requests
  - Proper database connection cleanup

---

## 🚀 Quick Start

### Development (Local)
```bash
cd /root/KORA
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

**Access Points**:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health check: http://localhost:3000/health

---

## 🏢 Staging Environment

### Prerequisites
1. Create .env.staging with actual staging credentials
2. Ensure staging database and Redis credentials are secure

### Deploy
```bash
# Build images (may take 5-10 minutes)
docker-compose -f docker-compose.staging.yml build

# Start services
docker-compose -f docker-compose.staging.yml up -d

# Run migrations
docker exec kora-backend-staging npm run db:migrate

# Seed demo data (optional)
docker exec kora-backend-staging npm run db:seed

# Check status
docker-compose -f docker-compose.staging.yml ps

# View logs
docker-compose -f docker-compose.staging.yml logs -f backend-staging
```

### Environment Variables
Edit `backend/.env.staging` and `frontend/.env.staging` with:
- Database credentials (kora_staging user)
- Redis credentials with password
- Clerk API keys for staging
- Payment gateway test keys
- Staging domain URLs

---

## 🌍 Production Environment

### Prerequisites
1. ✅ AWS/GCP/Azure account with Kubernetes or Docker Swarm
2. ✅ PostgreSQL managed service (AWS RDS, Azure Database, etc.)
3. ✅ Redis managed service (AWS ElastiCache, Azure Cache, etc.)
4. ✅ Container registry (ECR, Container Registry, etc.)
5. ✅ TLS certificates for domains
6. ✅ DNS configured
7. ✅ Load balancer configured

### Pre-Deployment Checklist
```bash
# 1. Set up environment file with production credentials
cp backend/.env.example backend/.env.prod
# Edit with production values:
# - DATABASE_URL: production database URI
# - REDIS_URL: production Redis URI
# - CLERK_SECRET_KEY: production Clerk key
# - Payment gateway LIVE keys
# - CORS_ORIGINS: production domains

# 2. Set up frontend environment
cp frontend/.env.example frontend/.env.prod
# Edit with:
# - VITE_API_BASE_URL: https://api.kora.app
# - VITE_ANALYTICS_KEY: production analytics key

# 3. Build and push images
docker-compose -f docker-compose.prod.yml build
docker tag kora-backend:latest your-registry/kora-backend:1.0.0
docker tag kora-frontend:latest your-registry/kora-frontend:1.0.0
docker push your-registry/kora-backend:1.0.0
docker push your-registry/kora-frontend:1.0.0
```

### Deploy to Production
```bash
# Using docker-compose on single server (NOT recommended for production)
# This is a simplified example - use Kubernetes or managed container services in production

docker-compose -f docker-compose.prod.yml up -d

# Or deploy to Kubernetes (recommended)
kubectl apply -f kora-deployment.yaml
```

---

## 📊 Database Migrations

### Automatic Migrations
- Run automatically on backend startup
- Located in `backend/src/db/migrations/`
- Numbered sequentially (001_, 002_, etc.)

### Manual Migration
```bash
# Run pending migrations
docker exec kora-backend npm run db:migrate

# On staging
docker exec kora-backend-staging npm run db:migrate

# On production
docker exec kora-backend-prod npm run db:migrate
```

### Seed Data
```bash
# Seed development data
docker exec kora-backend npm run db:seed

# Seed staging
docker exec kora-backend-staging npm run db:seed

# Note: Don't seed production
```

---

## 🏥 Health Checks

### Backend Health Endpoint
```bash
# Check backend health
curl http://localhost:3000/health

# Response:
# {
#   "status": "ok",
#   "service": "kora-backend",
#   "timestamp": "2026-03-14T10:30:00.000Z"
# }
```

### Health Check Endpoints
- **GET /health**: Simple health check
- **GET /api/health/metrics**: Detailed health with database metrics
- **GET /api/docs**: API documentation

### Docker Health Check
Each service has built-in health checks:
```bash
# Check container health
docker-compose ps
# STATUS column shows: Up (healthy) or Up (unhealthy)

# Get detailed health status
docker inspect kora-backend | grep -A 5 Health
```

---

## ⛔ Graceful Shutdown

The backend properly handles shutdown signals:

1. **SIGTERM/SIGINT**: Triggered by docker stop
2. **Grace Period**: 30 seconds to complete in-flight requests
3. **Database Cleanup**: Connections properly closed
4. **Worker Completion**: Active jobs finish before shutdown

Example:
```bash
# Graceful shutdown (recommended)
docker-compose down

# Timeout after 30s (force kill if needed)
docker-compose down --timeout 30
```

---

## 📈 Scaling Strategies

### Horizontal Scaling (Multiple Instances)

**docker-compose.prod.yml includes:**
- 2 backend instances (kora-backend-prod, kora-backend-prod-2)
- 1 worker instance (handles async jobs)
- 1 frontend instance
- Shared PostgreSQL and Redis

**To add more backend instances:**
```yaml
backend-prod-3:
  build: ...
  # same configuration as backend-prod
```

### Vertical Scaling (Increase Resources)

Edit `docker-compose.prod.yml` resource limits:
```yaml
deploy:
  resources:
    limits:
      cpus: '4'      # Increase from 2
      memory: 4G     # Increase from 2G
```

### Kubernetes Deployment (Recommended for Production)

See `kora-deployment.yaml` for Kubernetes manifests with:
- Horizontal Pod Autoscaler (HPA)
- Readiness/Liveness probes
- Resource requests and limits
- Rolling updates
- Service mesh integration (optional)

---

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit .env files to git
- ✅ Use secure vaults (AWS Secrets Manager, Vault, etc.)
- ✅ Rotate secrets regularly
- ✅ Use different credentials per environment

### Container Security
- ✅ Non-root user in containers (UID 1001)
- ✅ Read-only root filesystem (optional)
- ✅ Resource limits applied
- ✅ Health checks enabled

### Database Security
- ✅ Strong passwords in all environments
- ✅ Database in private network (no public IP)
- ✅ Encrypted connections (SSL/TLS)
- ✅ Automated backups enabled

### Network Security
- ✅ Services in isolated networks
- ✅ Load balancer with TLS termination
- ✅ WAF (Web Application Firewall)
- ✅ DDoS protection enabled

---

## 🔄 Backup & Recovery

### Database Backups
```bash
# Manual backup
docker exec kora-postgres pg_dump -U kora kora > backup-$(date +%Y%m%d).sql

# Restore backup
docker exec -i kora-postgres psql -U kora kora < backup-20260314.sql
```

### Automated Backups (Production)
- ✅ Enabled in production configuration
- ✅ Daily snapshots
- ✅ 30-day retention
- ✅ Cross-region replication

---

## 📊 Monitoring & Observability

### Logging
All services configured with JSON logging:
- Max file size: 50-100MB (production)
- Retention: 10 files
- Format: JSON for better parsing

### Metrics
Access via `/api/health/metrics`:
```bash
curl http://localhost:3000/api/health/metrics
```

### Structured Logging
Backend logs include:
- Request ID (for tracing)
- Organization ID (for multi-tenancy)
- User ID (for audit)
- Duration (performance tracking)

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Database not accessible: check DATABASE_URL
# - Port already in use: change port mapping
# - Missing environment variables: check .env file
```

### Database connection errors
```bash
# Check database is running
docker-compose ps postgres

# Check connectivity
docker-compose exec backend bash
psql $DATABASE_URL -c "SELECT 1"
```

### Frontend not loading
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up --build frontend
```

### Containers keep restarting
```bash
# Check container logs
docker-compose logs service-name

# Check resource usage
docker stats

# Increase resource limits if needed
```

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] All environment files configured
- [ ] Secrets stored in secure vault
- [ ] Database backups configured
- [ ] TLS certificates valid
- [ ] Load balancer configured
- [ ] DNS records updated
- [ ] Monitoring alerts set up
- [ ] Runbooks prepared

### Deployment
- [ ] Run database migrations
- [ ] Seed demo data (staging only)
- [ ] Health checks passing
- [ ] Logs being collected
- [ ] Metrics accessible
- [ ] Load balanced across instances

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Health endpoints responding
- [ ] Logs being captured
- [ ] Metrics being collected
- [ ] Backups working
- [ ] Alert notifications tested
- [ ] Team notified

---

## 📚 Additional Resources

- **Dockerfile Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **Docker Compose**: https://docs.docker.com/compose/compose-file/
- **Kubernetes**: https://kubernetes.io/docs/
- **PostgreSQL Performance Tuning**: https://www.postgresql.org/docs/current/runtime-config.html

---

## 🆘 Support

### Getting Help
1. Check logs: `docker-compose logs service-name`
2. Review this guide
3. Check troubleshooting section
4. Contact devops team

### Reporting Issues
Include in issue report:
- Error message (full stack trace)
- Environment (dev/staging/prod)
- Steps to reproduce
- Docker version
- OS version

---

**Last Updated**: March 14, 2026  
**Status**: Production Ready ✅
