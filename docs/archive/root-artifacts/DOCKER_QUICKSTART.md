# KORA Docker Quick Start Guide

## Prerequisites

- Docker Desktop installed (https://www.docker.com/products/docker-desktop)
- Docker Compose (included with Docker Desktop)
- Git
- ~5GB free disk space

## Quick Start (5 minutes)

### 1. Clone and Navigate

```bash
cd /path/to/KORA
```

### 2. Build Containers

```bash
docker-compose build
```

This builds:
- `kora-backend` - Express API server
- `kora-frontend` - React app
- `kora-worker` - BullMQ async worker

### 3. Start Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis cache
- Backend API
- Worker process
- Frontend app

### 4. Verify Services

```bash
docker-compose ps
```

All services should show "Up" or "healthy".

### 5. Access KORA

**Frontend**: http://localhost:5173  
**Backend API**: http://localhost:3000  
**API Docs**: http://localhost:3000/api/docs  
**Health Check**: http://localhost:3000/health

### 6. Test Login

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Common Commands

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Data

```bash
docker-compose down -v
```

### Rebuild After Code Changes

```bash
docker-compose build backend
docker-compose up -d backend
```

### Database Operations

```bash
# Run migrations
docker-compose exec backend npm run db:migrate

# Run seeds
docker-compose exec backend npm run db:seed

# Access database
docker-compose exec postgres psql -U kora -d kora
```

### Shell Access

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Database shell
docker-compose exec postgres bash
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Frontend Can't Reach Backend

```bash
# Verify backend is running
curl http://localhost:3000/health

# Check frontend logs
docker-compose logs frontend

# Verify network
docker-compose exec frontend curl http://backend:3000/health
```

### Database Connection Error

```bash
# Check postgres is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify connection
docker-compose exec backend psql $DATABASE_URL -c "SELECT 1"
```

## Environment Variables

Edit `docker-compose.yml` to change:

```yaml
environment:
  NODE_ENV: development
  DATABASE_URL: postgresql://kora:kora_dev_password@postgres:5432/kora
  REDIS_URL: redis://redis:6379
  JWT_SECRET: dev-secret-key-change-in-production
  VITE_API_BASE_URL: http://localhost:3000
```

## Production Deployment

See `CONTAINERIZATION_DEPLOYMENT_PLAN.md` for:
- Docker Hub image publishing
- VPS deployment (DigitalOcean, Linode, AWS)
- Render.com deployment
- Railway.app deployment
- AWS ECS deployment
- HTTPS/domain setup
- Reverse proxy configuration

## Next Steps

1. ✅ Services running locally
2. ✅ Frontend accessible at http://localhost:5173
3. ✅ Backend API at http://localhost:3000
4. ✅ Login flow working
5. → Deploy to production when ready

## Support

For issues, check:
- `CONTAINERIZATION_DEPLOYMENT_PLAN.md` - Troubleshooting section
- `docker-compose logs` - Service logs
- `docker ps` - Container status
- `docker inspect <container>` - Container details
