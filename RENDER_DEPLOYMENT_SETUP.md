# 🚀 KORA Render Deployment Guide

Complete step-by-step guide to deploy KORA to Render with production-ready configuration.

---

## 📋 Pre-Deployment Checklist

### Required Accounts & Services
- [ ] **Render Account** - [render.com](https://render.com)
- [ ] **GitHub Repository** - Connected to Render
- [ ] **Supabase Database** - Production database URL ready
- [ ] **Clerk Authentication** - Secret keys and webhook ready
- [ ] **Stripe Account** - Secret keys and webhooks ready
- [ ] **Optional: Sentry** - For error tracking (DSN)

### Required API Keys & Credentials (Gather These First)
```
✓ DATABASE_URL (Supabase)
✓ JWT_SECRET (generate: openssl rand -base64 32)
✓ SESSION_SECRET (generate: openssl rand -base64 32)
✓ CLERK_SECRET_KEY (from Clerk dashboard)
✓ CLERK_AUTHORIZED_PARTIES (your frontend URL)
✓ CLERK_WEBHOOK_SECRET (from Clerk webhooks)
✓ STRIPE_SECRET_KEY (from Stripe dashboard)
✓ STRIPE_WEBHOOK_SECRET (from Stripe webhooks)
✓ ANTHROPIC_API_KEY or OPENAI_API_KEY (AI provider)
```

---

## 🔑 Step 1: Generate Secrets

### Generate JWT_SECRET & SESSION_SECRET

**On macOS/Linux:**
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate SESSION_SECRET
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
# Generate JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# Generate SESSION_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**Or use online generator:**
- Visit: https://www.random.org/bytes/ (set to 32 bytes, Base64)

Save these values securely (password manager or secure note).

---

## 🔗 Step 2: Connect Render to GitHub

1. Go to [render.com](https://render.com) and sign up/log in
2. Click **"New +"** → **"Blueprint"**
3. Select **"GitHub"** as source
4. Connect GitHub account and authorize
5. Select repository: `erpforgeafrica-dotcom/Kora`
6. Select branch: `main` (for production)
7. Render will auto-detect `render.yaml` ✓

---

## 🔐 Step 3: Set Environment Variables on Render Dashboard

After Render detects your `render.yaml`, you'll see **"Environment Variables"** section.

### Manual Setup (Recommended)

Click **"Add Environment Variable"** for each secret:

#### **Database & Redis**
```
DATABASE_URL = postgresql://postgres.zihocnhvtgodnawnvoyj:KoraDB2024secure@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```
(Redis is auto-configured via `fromService` in render.yaml)

#### **Authentication**
```
JWT_SECRET = <paste-generated-value>
SESSION_SECRET = <paste-generated-value>
CLERK_SECRET_KEY = sk_test_xxxxxx (from Clerk dashboard)
CLERK_AUTHORIZED_PARTIES = https://kora-frontend-<random>.onrender.com
CLERK_WEBHOOK_SECRET = whsec_xxxxxx (from Clerk webhooks)
```

#### **Payments**
```
STRIPE_SECRET_KEY = sk_live_xxxxxx (from Stripe dashboard)
STRIPE_WEBHOOK_SECRET = whsec_xxxxxx (from Stripe webhooks)
```

#### **AI Provider** (Choose at least one)
```
ANTHROPIC_API_KEY = sk-ant-xxxxxx
# OR
OPENAI_API_KEY = sk-xxxxxx
# Optional: both can coexist
```

#### **Optional: Error Tracking**
```
SENTRY_DSN = https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

#### **Frontend Configuration** (Will be auto-filled after first deploy)
```
VITE_API_BASE_URL = https://kora-backend-<random>.onrender.com
VITE_CLERK_PUBLISHABLE_KEY = pk_test_xxxxxx (from Clerk frontend API key)
```

---

## 🚀 Step 4: Deploy

### From Render Dashboard
1. Click **"Deploy"** button
2. Render will:
   - Build Docker image for backend
   - Build worker service
   - Build frontend static site
   - Provision Redis
   - Run migrations automatically

### Deployment Flow
```
Building → Testing → Running Migrations → Live
```

Expected time: **5-10 minutes**

---

## ✅ Step 5: Verify Deployment

### Check Service Status

1. **Backend API**
   - Visit: `https://kora-backend-<random>.onrender.com/health`
   - Expected response: `{"status":"ok"}`

2. **Frontend**
   - Visit: `https://kora-frontend-<random>.onrender.com`
   - Should load React app

3. **Redis Service**
   - Should show "Running" in Render dashboard

4. **Worker Service**
   - Should show "Running" in Render dashboard

### Check Logs

**Backend Logs:**
1. Go to Render dashboard → `kora-backend`
2. Click **"Logs"**
3. Should see: `[INFO] Server running on port 3000`

**Worker Logs:**
1. Go to Render dashboard → `kora-worker`
2. Click **"Logs"**
3. Should see: `[INFO] Worker started...`

**Build Failures?**
- Check **"Build Logs"** tab
- Common issues:
  - Missing environment variables
  - TypeScript compilation errors
  - Database connection timeout

---

## 🔄 Step 6: Post-Deployment Configuration

### Update Clerk Webhooks
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks**
3. Add endpoint: `https://kora-backend-<random>.onrender.com/api/webhooks/clerk`
4. Select events: `user.created`, `user.updated`, `session.created`, `session.ended`

### Update Stripe Webhooks
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Add endpoint: `https://kora-backend-<random>.onrender.com/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `charge.failed`, `customer.subscription.*`

### Update Frontend API URL
If frontend shows 404 errors:
1. Go to Render dashboard → `kora-frontend` → **Environment**
2. Add/update:
   ```
   VITE_API_BASE_URL = https://kora-backend-<random>.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY = pk_test_xxxxx
   ```
3. Click **"Clear Cache and Redeploy"**

---

## 🔐 Step 7: Security Hardening

### Enable Auto-Deploy from Protected Branch
1. Render dashboard → **Settings**
2. Set **"Auto-deploy on push to main"** ✓

### Set Up Monitoring & Alerts
1. Optional: Connect Sentry for error tracking
2. Optional: Add Grafana for metrics

### Backup Strategy
1. **Database**: Enable Supabase automatic backups (default: enabled)
2. **Code**: GitHub is your backup (use main branch protection)

---

## 📊 Environment Overview

| Service | URL | Status |
|---------|-----|--------|
| **Backend API** | `https://kora-backend-<random>.onrender.com` | Check `/health` |
| **Frontend** | `https://kora-frontend-<random>.onrender.com` | Check loads |
| **Redis** | Internal (via `REDIS_URL`) | Auto-configured |
| **Database** | Supabase (external) | Check `DATABASE_URL` |

---

## 🛠️ Troubleshooting

### Backend won't start: "Cannot connect to database"
**Solution:**
1. Verify `DATABASE_URL` is correct in Environment Variables
2. Check Supabase database is running
3. Check network access (Supabase IP whitelist)

### Frontend shows 404 errors
**Solution:**
1. Update `VITE_API_BASE_URL` with correct backend URL
2. Clear cache: Render dashboard → `kora-frontend` → **Clear Cache and Redeploy**

### Worker not processing jobs
**Solution:**
1. Check `REDIS_URL` is synced from `kora-redis` service
2. View worker logs for errors
3. Restart worker: Render dashboard → `kora-worker` → **Restart service**

### Authentication fails: "Invalid Clerk key"
**Solution:**
1. Verify `CLERK_SECRET_KEY` matches your Clerk account
2. Verify `CLERK_AUTHORIZED_PARTIES` includes your Render frontend URL
3. Check Clerk webhook is properly configured

### Migrations fail on deploy
**Solution:**
1. Check database connection is active
2. View build logs for SQL errors
3. Manually run migrations:
   ```bash
   # SSH into Render service
   npm run db:migrate
   ```

---

## 📈 Scaling Recommendations

### Current Setup (Free Tier)
- **Backend**: Starter ($7/month) - 512MB RAM, 0.5 CPU
- **Worker**: Starter ($7/month) - 512MB RAM, 0.5 CPU
- **Frontend**: Free - Static hosting
- **Redis**: Free - 256MB

### For Production Load
- **Backend**: Standard ($25/month) - 2GB RAM, 1 CPU
- **Worker**: Standard ($25/month) - 2GB RAM, 1 CPU
- **Frontend**: Starter ($7/month) - Enables caching
- **Redis**: Standard ($15/month) - 1GB (if needed)

---

## 🔄 Updating KORA on Render

### Auto-Deploy (Recommended)
1. Push code to `main` branch
2. Render automatically:
   - Pulls latest code
   - Rebuilds image
   - Runs migrations
   - Restarts services

### Manual Update
1. Go to Render dashboard → Select service
2. Click **"Restart service"** or **"Redeploy"**

### Rollback to Previous Deploy
1. Render dashboard → Service → **"Deploy history"**
2. Click previous deploy version
3. Select **"Redeploy"**

---

## 📞 Support & Resources

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **KORA Issues**: Check GitHub discussions
- **Emergency Support**: Contact Render support via dashboard

---

**Last Updated**: May 2, 2026 | **Version**: 1.0
