# 🚀 KORA Render Deployment Checklist & Commands

**Quick reference for deploying KORA to Render**

---

## 📋 Pre-Deployment Checklist

### Local Validation
- [ ] Backend builds: `cd backend && npm run build` → ✓ Success
- [ ] Frontend builds: `cd frontend && npm run build` → ✓ Success  
- [ ] No TypeScript errors: `cd backend && npm run typecheck` → ✓ Pass
- [ ] Migrations exist: `ls backend/src/db/migrations/*.sql` → ✓ Files listed
- [ ] No hardcoded secrets in render.yaml ✓
- [ ] render.yaml and render.staging.yaml committed to git ✓

### Environment Variables Generated
- [ ] JWT_SECRET: `openssl rand -hex 32` (copy output)
- [ ] SESSION_SECRET: `openssl rand -hex 32` (copy output)
- [ ] Clerk keys copied from Clerk dashboard
- [ ] Stripe keys from Stripe dashboard
- [ ] AI provider keys ready (at least one)
- [ ] Frontend URLs noted for VITE_API_BASE_URL

### Git Ready
- [ ] All changes committed: `git status` → ✓ Clean
- [ ] Ready to push: `git log --oneline -3` → ✓ Shows recent commits

---

## 🎬 Deployment Steps

### Step 1: Run Local Validation (5 min)

**On Windows (PowerShell):**
```powershell
cd c:\Users\hp\KORA
.\scripts\render-validate.ps1 -Environment production
```

**On macOS/Linux (Bash):**
```bash
cd ~/KORA
chmod +x ./scripts/render-validate.sh
./scripts/render-validate.sh production
```

Expected output: ✅ Validation PASSED

---

### Step 2: Verify Render Configuration Files

```bash
# Check production config
cat render.yaml | grep -A 5 "name: kora-backend"

# Check staging config
cat render.staging.yaml | grep -A 5 "name: kora-backend-staging"
```

---

### Step 3: Push to GitHub (2 min)

```bash
# Stage all changes
git add render.yaml render.staging.yaml RENDER_DEPLOYMENT_GUIDE.md RENDER_ENV_REFERENCE.md

# Commit
git commit -m "ci: add Render deployment configuration and guides"

# Push to main branch
git push origin main
```

Render auto-detects your repository and deploys.

---

### Step 4: Set Environment Variables in Render (5 min)

1. Go to https://render.com/dashboard
2. Click **kora-backend** service
3. Click **Environment** tab
4. Click **Add Environment Variable**

**Copy-paste each variable:**

```
DATABASE_URL=postgresql://postgres.zihocnhvtgodnawnvoyj:KoraDB2024secure@aws-0-eu-west-1.pooler.supabase.com:6543/postgres

JWT_SECRET=<paste-generated-value>

SESSION_SECRET=<paste-generated-value>

CLERK_SECRET_KEY=sk_test_Hkd6sNcwj9C4tQ8VOMUAbSv3HjimNEYxndUz5ffK7p

CLERK_AUTHORIZED_PARTIES=https://kora-frontend.onrender.com

CLERK_WEBHOOK_SECRET=<from-clerk-dashboard>

STRIPE_SECRET_KEY=sk_live_your_key

STRIPE_WEBHOOK_SECRET=<from-stripe-dashboard>

SENTRY_DSN=<optional-from-sentry>

CORS_ORIGINS=https://kora-frontend.onrender.com

API_BASE_URL=https://kora-backend.onrender.com/api

ANTHROPIC_API_KEY=sk-ant-your-key

AI_BUDGET_USD_MONTHLY=100
```

5. Repeat for **kora-worker** service (same database/redis/secrets)
6. Click **Save Changes**

---

### Step 5: Add Frontend Environment Variables (3 min)

Go to **kora-frontend** service:

1. Click **Environment** tab
2. Add:

```
VITE_API_BASE_URL=https://kora-backend.onrender.com

VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
```

3. Save

---

### Step 6: Monitor Deployment (10 min)

```bash
# Option A: Render Dashboard (easiest)
# Visit: https://render.com/dashboard
# Watch "Recent Activity" tab for deployment status

# Option B: CLI (if installed)
render logs --service kora-backend --follow

# Option C: Check health endpoint
curl https://kora-backend.onrender.com/health
# Expected: {"status":"ok"}
```

---

### Step 7: Run Database Migrations (5 min)

**Via Render Shell:**

1. Dashboard → kora-backend → Shell tab
2. Run:

```bash
npm run db:migrate:prod
```

Expected output: ✓ Migrations applied successfully

**Optional: Seed demo data**

```bash
npm run db:seed
```

---

## ✅ Post-Deployment Verification

### Health Checks

```bash
# Backend API health
curl https://kora-backend.onrender.com/health
# Response: {"status":"ok","version":"0.2.0"}

# Frontend loads
curl -I https://kora-frontend.onrender.com
# Response: HTTP/1.1 200 OK

# Test API endpoint
curl -H "Authorization: Bearer <test-token>" \
  https://kora-backend.onrender.com/api/auth/profile
```

### Feature Validation

- [ ] Frontend loads at https://kora-frontend.onrender.com ✓
- [ ] Can click "Sign In" (Clerk modal appears) ✓
- [ ] Authentication redirects after login ✓
- [ ] API calls work (check browser DevTools Network) ✓
- [ ] No CORS errors in console ✓
- [ ] Backend logs show requests: `render logs --service kora-backend`
- [ ] Worker is running: `render logs --service kora-worker`

### Database Verification

```bash
# Via psql or database admin tool
# Connect to Supabase production database
# Check tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# Should show: bookings, appointments, users, organizations, etc.
```

---

## 🔄 Deployment Commands Reference

### View Live Logs

```bash
# Backend API
render logs --service kora-backend --follow --lines 100

# Worker
render logs --service kora-worker --follow --lines 100

# Frontend
render logs --service kora-frontend --follow --lines 50
```

### Restart Services

```bash
# Backend
render restart --service kora-backend

# Worker
render restart --service kora-worker

# Frontend
render restart --service kora-frontend
```

### Update Environment Variables

```bash
# Via CLI
render env set JWT_SECRET=new_value --service kora-backend

# Via Dashboard (recommended)
# Services → kora-backend → Environment → Edit inline
```

### Deploy Specific Branch

```bash
# Main branch (production)
git push origin main
# Auto-deploys via render.yaml

# Staging branch
git push origin staging
# Auto-deploys via render.staging.yaml (if linked)
```

### Rollback to Previous Deployment

```bash
# Via Render Dashboard:
# Services → kora-backend → Deployments tab
# Click "Deploy" on previous version
```

---

## 🆘 Troubleshooting Commands

### Check if Services Are Running

```bash
render list-services
# Shows: kora-backend, kora-worker, kora-frontend, kora-redis
```

### View Recent Errors

```bash
render logs --service kora-backend --since 1h
```

### Check Database Connection

```bash
# Via Render Shell (backend service)
npm run db:migrate:status
```

### Test Redis Connection

```bash
# Via Render Shell
node -e "const redis = require('ioredis'); const r = new redis(process.env.REDIS_URL); r.ping().then(console.log).catch(console.error)"
```

### Verify Environment Variables

```bash
# Via Render Shell
env | grep DATABASE_URL
env | grep JWT_SECRET
env | grep CLERK_SECRET_KEY
```

---

## 📊 Performance Optimization

### Monitor Resource Usage

```bash
render describe-service --service kora-backend
# Shows: Memory, CPU, disk usage
```

### Scale Up if Needed

```bash
# Via Dashboard:
# Service → Plan
# Upgrade from Starter ($7/mo) to Standard ($25/mo) or higher
```

### Cache Optimization

```bash
# Check Redis memory usage
render describe-service --service kora-redis

# If needed, upgrade Redis plan
```

---

## 🔐 Security Checks

### Verify Secrets Are Hidden

```bash
# render.yaml should NOT contain actual secret values
grep -n "sk_test_\|sk_live_\|sk-\|Bearer " render.yaml
# Response: (no output = good ✓)
```

### Check Git History

```bash
# Ensure no secrets committed
git log --all --source --full-history -S "sk_test_" -- render.yaml
# Response: (no output = good ✓)
```

### Rotate Secrets Quarterly

```bash
# Generate new JWT_SECRET
openssl rand -hex 32

# Update in Render Dashboard
# Services → kora-backend → Environment
# Edit JWT_SECRET → Save → Auto-restart ✓
```

---

## 📞 Support & Resources

### Documentation
- [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md) - Full deployment guide
- [RENDER_ENV_REFERENCE.md](RENDER_ENV_REFERENCE.md) - Environment variables reference
- [render.yaml](render.yaml) - Production configuration
- [render.staging.yaml](render.staging.yaml) - Staging configuration

### Useful Links
- Render Dashboard: https://render.com/dashboard
- Render Docs: https://render.com/docs
- Render CLI: https://render.com/docs/render-cli
- Status Page: https://status.render.com

### Common Issues

**"Build failed"**
```bash
# Check logs
render logs --service kora-backend --lines 200

# Common causes:
# 1. npm install failed → Check package.json
# 2. TypeScript error → Run: npm run typecheck locally
# 3. Missing migration files → Check: backend/src/db/migrations/
```

**"Service won't start"**
```bash
# Check environment variables are set
render describe-service --service kora-backend | grep Environment

# Verify database connectivity
npm run db:migrate:status
```

**"CORS errors in browser"**
```bash
# Check CORS_ORIGINS variable
render env --service kora-backend | grep CORS_ORIGINS

# Should be: https://kora-frontend.onrender.com (exactly)
```

---

## 📝 Deployment Log Template

Use this to document your deployment:

```
## Deployment Record - [DATE]

**Environment:** Production / Staging
**Deployed By:** [Your name]
**Git Commit:** [SHA-1 hash]
**Duration:** [X min]

### Pre-Deployment
- [ ] Local validation passed
- [ ] All tests passing
- [ ] No hardcoded secrets

### Deployment
- [ ] Environment variables set
- [ ] Render.yaml deployed
- [ ] Database migrations applied
- [ ] Worker started

### Verification
- [ ] Health check: ✓
- [ ] Frontend loads: ✓
- [ ] Authentication works: ✓
- [ ] API responds: ✓
- [ ] No errors in logs: ✓

### Notes
[Any issues or notes]

### Rollback Plan
If issues: `render restart --service kora-backend`
```

---

**Last Updated:** May 4, 2026  
**Status:** ✅ Ready for Deployment

