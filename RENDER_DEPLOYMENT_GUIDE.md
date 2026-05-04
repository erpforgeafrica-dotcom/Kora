# 🚀 KORA Render Deployment Guide

**Last Updated**: May 4, 2026

---

## ⚠️ CRITICAL: Security Fix Required

Your current `render.yaml` has **hardcoded secrets**. These must be removed immediately before deployment.

### Quick Fix
```bash
# Remove secrets from render.yaml and set them in Render dashboard instead
git diff render.yaml  # Review changes
git add render.yaml
git commit -m "fix: remove hardcoded secrets from render.yaml"
git push origin main
```

---

## Phase 1: Pre-Deployment Setup (Local Validation)

### Step 1: Verify Local Environment

```bash
# Backend checks
cd backend
npm run build              # Ensure TypeScript compiles
npm run typecheck          # Type validation
npm run db:migrate:status  # Check migration status
npm run test               # Run test suite

# Frontend checks
cd ../frontend
npm run build              # Ensure Vite builds
npm run test               # Run frontend tests
```

### Step 2: Validate Render Configuration

```bash
# Backend health check should pass locally
curl http://localhost:3000/health

# Verify env vars are in place
npm run build && node dist/server.js --dry-run  # Validate startup
```

### Step 3: Run Pre-Deployment Validation Script

```bash
# From repository root
chmod +x ./scripts/render-validate.sh
./scripts/render-validate.sh production
```

---

## Phase 2: Render Dashboard Setup

### Step 1: Create Render Account & Connect GitHub

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select repository: `erpforgeafrica-dotcom/Kora`
5. Render auto-detects `render.yaml` ✅

### Step 2: Create Environment Variables (Dashboard)

Navigate to **Render Dashboard** → **Environment** and add these secrets:

#### Database & Cache
```
DATABASE_URL=postgresql://postgres.zihocnhvtgodnawnvoyj:KoraDB2024secure@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

#### Authentication (Generate new values)
```
JWT_SECRET=<use-crypto-random-32-chars>
SESSION_SECRET=<use-crypto-random-32-chars>
CLERK_SECRET_KEY=sk_test_your_actual_key
CLERK_AUTHORIZED_PARTIES=https://kora-frontend.onrender.com
CLERK_WEBHOOK_SECRET=<your-webhook-secret>
```

#### Payment Gateway
```
STRIPE_SECRET_KEY=sk_live_your_actual_key
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
```

#### Frontend
```
VITE_API_BASE_URL=https://kora-backend.onrender.com
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key
```

#### AI Providers (at least one)
```
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-key
AI_BUDGET_USD_MONTHLY=100
```

#### CORS & Monitoring
```
CORS_ORIGINS=https://kora-frontend.onrender.com
API_BASE_URL=https://kora-backend.onrender.com/api
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

---

## Phase 3: Deploy from render.yaml

### Option A: Auto-Deploy (Recommended)

Render will automatically deploy when you push to `main`:

```bash
# Update render.yaml (secure version without secrets)
git add render.yaml
git commit -m "ci: update render.yaml with production configuration"
git push origin main
```

Render detects the `render.yaml` and deploys all services automatically.

### Option B: Manual Deploy via Render CLI

```bash
# Install Render CLI
npm install -g render-cli

# Deploy from YAML
render deploy --spec render.yaml
```

---

## Phase 4: Post-Deployment Validation

### Health Check

```bash
# Backend health
curl https://kora-backend.onrender.com/health

# Frontend should load
curl https://kora-frontend.onrender.com
```

### Database Migration

```bash
# Via Render dashboard → Backend service → Shell
npm run db:migrate:prod
npm run db:seed  # Optional: seed demo data
```

### Worker Status

Check **Render Dashboard** → **kora-worker** logs:
- Should see: `Starting BullMQ worker...`
- Should see: `Connected to Redis...`

### Log Monitoring

```bash
# Stream backend logs
render logs --service kora-backend --follow

# Stream worker logs
render logs --service kora-worker --follow
```

---

## 📋 Service Configuration Summary

| Service | Type | Runtime | Plan | Build Command | Start Command |
|---------|------|---------|------|-------|-------|
| **kora-backend** | Web | Docker | Starter ($7/mo) | N/A (Dockerfile) | npm run start:render |
| **kora-worker** | Worker | Node | Starter ($7/mo) | npm ci && npm run build | npm run start:worker |
| **kora-frontend** | Static | N/A | Free | npm ci && npm run build | N/A |
| **kora-redis** | Redis | N/A | Free | N/A | N/A |

**Total Monthly Cost**: ~$14 (starter backend + worker) + data transfer

---

## 🛑 Troubleshooting

### Backend Won't Start

```bash
# Check logs
render logs --service kora-backend --lines 100

# Common issues:
# 1. DATABASE_URL not set → Add to Render dashboard Environment
# 2. Build failed → Check npm run build locally
# 3. Startup script → Verify npm run start:render works locally
```

### Worker Not Processing Jobs

```bash
# Check worker logs
render logs --service kora-worker --lines 100

# Common issues:
# 1. REDIS_URL not set → Auto-linked in render.yaml ✓
# 2. DATABASE_URL not set → Add to Render Environment
```

### Frontend Not Loading

```bash
# Check frontend logs
render logs --service kora-frontend --lines 50

# Common issues:
# 1. VITE_API_BASE_URL not set → Add to Render Environment
# 2. Build failed → npm run build locally should pass
```

### CORS Errors

```bash
# Set CORS_ORIGINS in Render Environment to match frontend URL:
CORS_ORIGINS=https://kora-frontend.onrender.com
```

---

## 🔄 Deployment Workflow

### For Main Branch (Production)

```bash
# 1. Commit & push to main
git push origin main

# 2. Render auto-deploys via render.yaml
# 3. Monitor deployment
render logs --service kora-backend --follow

# 4. Validate health
curl https://kora-backend.onrender.com/health
```

### For Staging Branch

```bash
# 1. Use render.staging.yaml (separate from main)
git push origin staging

# 2. Link staging branch to render.staging.yaml in Render dashboard
# 3. Staging deploys independently
```

---

## 📝 Post-Deployment Checklist

- [ ] Backend health check responds: `GET /health` → 200 OK
- [ ] Database migrations applied successfully
- [ ] Frontend loads without 404s
- [ ] Clerk authentication works (test login)
- [ ] API endpoints respond (test a booking endpoint)
- [ ] Notifications queue working (check worker logs)
- [ ] Redis connection stable (check worker logs)
- [ ] Logs have no error stack traces
- [ ] SSL certificate auto-provisioned (HTTPS works)

---

## 🚀 Next Steps

1. **Remove hardcoded secrets** from render.yaml (see Critical section)
2. **Set environment variables** in Render dashboard (Phase 2)
3. **Push to main branch** to trigger deployment
4. **Monitor deployment** via Render logs
5. **Validate all services** using health checks
6. **Set up staging** using render.staging.yaml

---

## 📞 Support

- Render Docs: https://render.com/docs
- Issue: Check Render logs first
- Ask: Check backend `npm run test` locally first

