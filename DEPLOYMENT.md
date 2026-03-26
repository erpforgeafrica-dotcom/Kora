# KÓRA Platform Deployment Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker (optional, for containerized deployment)
- AWS Account (for S3 media storage)
- Clerk Account (for authentication)

## Environment Setup

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/kora_prod
REDIS_URL=redis://host:6379

# Authentication
CLERK_SECRET_KEY=sk_live_...
CLERK_AUTHORIZED_PARTIES=https://app.yourdomain.com

# Server
PORT=3000
NODE_ENV=production
API_BASE_URL=https://api.yourdomain.com

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
MISTRAL_API_KEY=...

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=kora-media-prod

# Payment Gateways
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
FLUTTERWAVE_SECRET_KEY=...
PAYSTACK_SECRET_KEY=...

# Social Media
META_APP_ID=...
META_APP_SECRET=...
META_OAUTH_REDIRECT_URI=https://api.yourdomain.com/api/social/auth/callback
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...

# Google Calendar (optional)
GOOGLE_CALENDAR_CREDENTIALS={"type":"service_account",...}
```

### Frontend (.env.production)
```env
VITE_API_URL=https://api.yourdomain.com
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

## Database Setup

### 1. Create Database
```bash
createdb kora_prod
```

### 2. Run Migrations
```bash
cd backend
npm run db:migrate
```

### 3. Seed Initial Data (Optional)
```bash
npm run db:seed
```

## Build Process

### Backend
```bash
cd backend
npm install --production
npm run build
```

### Frontend
```bash
cd frontend
npm install --production
npm run build
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

#### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: kora_prod
      POSTGRES_USER: kora
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    restart: always

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://kora:${DB_PASSWORD}@postgres:5432/kora_prod
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      - postgres
      - redis
    restart: always

  worker:
    build: ./backend
    command: npm run start:worker
    environment:
      DATABASE_URL: postgresql://kora:${DB_PASSWORD}@postgres:5432/kora_prod
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    restart: always

volumes:
  postgres_data:
```

#### Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: AWS (ECS + RDS + ElastiCache)

#### Infrastructure
- **ECS Fargate**: Backend + Worker containers
- **RDS PostgreSQL**: Database
- **ElastiCache Redis**: Queue + cache
- **S3**: Media storage
- **CloudFront**: Frontend CDN
- **ALB**: Load balancer

#### Deploy with Terraform
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

### Option 3: Heroku

#### Backend
```bash
heroku create kora-api
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
git push heroku main
```

#### Worker
```bash
heroku ps:scale worker=1
```

#### Frontend (Vercel)
```bash
vercel --prod
```

### Option 4: VPS (Ubuntu 22.04)

#### 1. Install Dependencies
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Redis
sudo apt-get install -y redis-server

# Nginx
sudo apt-get install -y nginx

# PM2
sudo npm install -g pm2
```

#### 2. Setup Database
```bash
sudo -u postgres createuser kora
sudo -u postgres createdb kora_prod
sudo -u postgres psql -c "ALTER USER kora WITH PASSWORD 'your_password';"
```

#### 3. Deploy Backend
```bash
cd /var/www/kora/backend
npm install --production
npm run build
pm2 start dist/index.js --name kora-api
pm2 start dist/workers.js --name kora-worker
pm2 save
pm2 startup
```

#### 4. Deploy Frontend
```bash
cd /var/www/kora/frontend
npm install --production
npm run build
sudo cp -r dist/* /var/www/html/
```

#### 5. Configure Nginx
```nginx
# /etc/nginx/sites-available/kora
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/kora /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. SSL with Let's Encrypt
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Health Checks

### Backend
```bash
curl https://api.yourdomain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "kora-backend",
  "timestamp": "2024-03-10T12:00:00.000Z"
}
```

### Database
```bash
psql $DATABASE_URL -c "SELECT 1"
```

### Redis
```bash
redis-cli -u $REDIS_URL ping
```

## Monitoring

### Application Monitoring
- **Sentry**: Error tracking
- **DataDog**: APM + logs
- **New Relic**: Performance monitoring

### Infrastructure Monitoring
- **CloudWatch** (AWS)
- **Prometheus + Grafana**
- **Uptime Robot**: Uptime monitoring

### Alerts
- API response time > 2s
- Error rate > 1%
- Database connections > 80%
- Redis memory > 90%
- Disk space < 10%

## Backup Strategy

### Database Backups
```bash
# Daily backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://kora-backups/db/
```

### Automated Backups (Cron)
```bash
# /etc/cron.d/kora-backup
0 2 * * * /usr/local/bin/backup-kora.sh
```

### Retention Policy
- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

## Scaling

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale workers
docker-compose -f docker-compose.prod.yml up -d --scale worker=2
```

### Database Scaling
- **Read Replicas**: For read-heavy workloads
- **Connection Pooling**: PgBouncer
- **Partitioning**: By organization_id

### Redis Scaling
- **Redis Cluster**: For high availability
- **Separate Queues**: Different Redis instances for cache vs queues

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables secured (not in code)
- [ ] Database credentials rotated
- [ ] API rate limiting enabled
- [ ] CORS configured correctly
- [ ] Clerk webhook signatures verified
- [ ] Payment webhook signatures verified
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React escapes by default)
- [ ] CSRF protection (SameSite cookies)
- [ ] Security headers (Helmet.js)
- [ ] Regular dependency updates
- [ ] Firewall rules configured
- [ ] SSH key-based authentication only
- [ ] Fail2ban installed

## Rollback Procedure

### Backend Rollback
```bash
# Revert to previous version
git checkout <previous-commit>
npm run build
pm2 restart kora-api
```

### Database Rollback
```bash
# Restore from backup
gunzip < backup_20240310.sql.gz | psql $DATABASE_URL
```

### Frontend Rollback
```bash
# Revert deployment (Vercel)
vercel rollback
```

## Performance Optimization

### Backend
- Enable gzip compression
- Use Redis caching
- Optimize database queries (indexes)
- Connection pooling
- CDN for static assets

### Frontend
- Code splitting (already implemented)
- Image optimization (WebP)
- Lazy loading
- Service Worker caching
- Minification (Vite does this)

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
pm2 logs kora-api

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Redis connection
redis-cli -u $REDIS_URL ping
```

### High Memory Usage
```bash
# Check Node.js memory
pm2 monit

# Restart if needed
pm2 restart kora-api
```

### Database Connection Errors
```bash
# Check connection limit
psql $DATABASE_URL -c "SHOW max_connections;"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

## Support

- Documentation: https://docs.yourdomain.com
- Status Page: https://status.yourdomain.com
- Support Email: support@yourdomain.com
- Slack: #kora-ops
