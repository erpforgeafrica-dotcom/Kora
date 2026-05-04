# 🎯 KORA Railway Deployment - Action Plan

## 📊 Current Status (May 4, 2026)

| Component | Status | URL |
|-----------|--------|-----|
| **Backend API** | ✅ Running | `https://kora-production-7661.up.railway.app/health` |
| **Frontend** | ⚠️ Blank Page | `https://kora-production-7661.up.railway.app/` |
| **Database** | ✅ Connected | Supabase (configured) |
| **Redis** | ✅ Connected | Railway managed |
| **Health Check** | ✅ Passing | API responds correctly |

---

## 🔧 What Was Fixed

### 1. **Frontend Dockerfile Updated** ✅
- Added build-time environment variable support
- Frontend can now receive `VITE_CLERK_PUBLISHABLE_KEY` during build
- Properly exports environment variables for Vite build process

**File**: [frontend/Dockerfile](frontend/Dockerfile)

### 2. **Error Handling Improved** ✅
- Frontend shows proper error message instead of blank page if Clerk key is missing
- Users see configuration error page with instructions
- Easier debugging on deployment

**File**: [frontend/src/main.tsx](frontend/src/main.tsx)

### 3. **Documentation Created** ✅
- Comprehensive Railway deployment guide
- Environment variable reference guide
- Validation script for local testing

**Files**:
- [RAILWAY_DEPLOYMENT_CONFIG.md](RAILWAY_DEPLOYMENT_CONFIG.md)
- [validate-railway-deployment.js](validate-railway-deployment.js)

---

## ⚡ IMMEDIATE ACTIONS REQUIRED

### **Phase 1: Configure Environment Variables on Railway (15 minutes)**

#### Step 1: Get Required Secrets
Before configuring Railway, gather these from your service providers:

```
From Clerk Dashboard:
- VITE_CLERK_PUBLISHABLE_KEY (starts with pk_live_)
- CLERK_SECRET_KEY (starts with sk_live_)
- CLERK_WEBHOOK_SECRET (starts with whsec_)

From Stripe Dashboard:
- STRIPE_SECRET_KEY (starts with sk_live_)
- STRIPE_WEBHOOK_SECRET

From your own records:
- JWT_SECRET (generate if not saved)
- SESSION_SECRET (generate if not saved)
```

#### Step 2: Generate Random Secrets
If you need to generate JWT_SECRET and SESSION_SECRET:

```bash
# Generate 32-character random strings
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 3: Add Variables to Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **Kora** project
3. Select **Frontend Service** (if separate)
4. Click **Variables** tab
5. Add these REQUIRED variables:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_[your_key]
VITE_API_BASE_URL=https://kora-production-7661.up.railway.app
VITE_ORG_ID=org_production
VITE_APP_NAME=KORA Production
```

6. **SAVE** - Railway auto-redeploys
7. Wait for deployment to complete (~3-5 minutes)

#### Step 4: Verify Backend Variables

1. Select **Backend Service**
2. Click **Variables** tab
3. Ensure these exist:
   - DATABASE_URL ✅
   - REDIS_URL ✅
   - CLERK_SECRET_KEY ✅
   - JWT_SECRET ✅
   - SESSION_SECRET ✅
   - STRIPE_SECRET_KEY ✅ (if payments enabled)
   - CORS_ORIGINS ✅

---

### **Phase 2: Verify Deployment (10 minutes)**

After Railway redeploys, run these checks:

#### Check 1: Backend Health
```bash
curl https://kora-production-7661.up.railway.app/health
# Should return: {"status":"ok","service":"kora-backend",...}
```

#### Check 2: Frontend Loads
```bash
curl https://kora-production-7661.up.railway.app/ | grep "<title>"
# Should return: <title>KORA Dashboard</title>
```

#### Check 3: Browser Test
1. Open `https://kora-production-7661.up.railway.app` in browser
2. Press F12 to open DevTools → Console
3. Should see NO red errors
4. Should see Clerk login form (not error message)

#### Check 4: Assets Load
1. DevTools → Network tab
2. Refresh page
3. All .js and .css files should be 200 status
4. No CORS errors

---

### **Phase 3: Test Authentication (5 minutes)**

1. Frontend loads → Click "Sign In"
2. Redirected to Clerk login page → ✅ Success
3. Enter credentials → ✅ Success
4. Redirected back to dashboard → ✅ Success
5. Can make API calls → ✅ Success

---

## 📚 Documentation Files Created

| File | Purpose |
|------|---------|
| [RAILWAY_DEPLOYMENT_CONFIG.md](RAILWAY_DEPLOYMENT_CONFIG.md) | Complete Railway setup guide with all env vars |
| [validate-railway-deployment.js](validate-railway-deployment.js) | Script to validate local setup before deploying |
| This file | Action plan and current status |

---

## 🚀 Quick Command Reference

### Local Validation
```bash
# Test local setup before deploying
node validate-railway-deployment.js
```

### Check Deployment Status
```bash
# Backend health
curl https://kora-production-7661.up.railway.app/health

# Frontend
curl https://kora-production-7661.up.railway.app/
```

### View Railway Logs
```bash
# Using Railway CLI
railway login
railway link
railway logs
```

---

## ✅ Deployment Checklist

### Before Adding Variables
- [ ] Have Clerk API keys ready
- [ ] Have JWT_SECRET and SESSION_SECRET (or generated new ones)
- [ ] Have Stripe/payment keys if using payments
- [ ] Have database URL and Redis URL

### Adding Variables
- [ ] Add VITE_CLERK_PUBLISHABLE_KEY to frontend
- [ ] Add VITE_API_BASE_URL to frontend
- [ ] Verify backend has all required variables
- [ ] Save/confirm Railway redeploys

### After Deployment
- [ ] Frontend loads without errors
- [ ] Backend health check passes
- [ ] No CORS errors in browser console
- [ ] Login works with Clerk
- [ ] Can make API calls from frontend
- [ ] Check Railway logs for errors

### Post-Deployment Monitoring
- [ ] Monitor Railway dashboard for errors
- [ ] Check backend logs daily
- [ ] Monitor database connection status
- [ ] Alert on deployment failures

---

## 🆘 Troubleshooting Reference

### Problem: Frontend Still Shows Blank Page
**Solution**:
1. Verify VITE_CLERK_PUBLISHABLE_KEY is set in Railway
2. Check if Railway redeploy completed
3. Clear browser cache: `Ctrl+Shift+Delete` → Clear all
4. Try incognito window
5. Check browser console (F12) for errors

### Problem: Cannot Sign In
**Solution**:
1. Verify VITE_CLERK_PUBLISHABLE_KEY matches Clerk dashboard
2. Check CLERK_SECRET_KEY on backend
3. Verify CLERK_AUTHORIZED_PARTIES is set correctly
4. Check Railway logs for authentication errors

### Problem: API Calls Fail with CORS Error
**Solution**:
1. Verify VITE_API_BASE_URL points to correct backend
2. Verify CORS_ORIGINS on backend includes frontend URL
3. Restart backend service on Railway
4. Check both HTTP and HTTPS versions are consistent

### Problem: Database Connection Error
**Solution**:
1. Verify DATABASE_URL is correct
2. Test connection locally first
3. Check Supabase dashboard for connection status
4. Increase DB connection pool size if needed

---

## 📞 Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Clerk Docs**: https://clerk.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **KORA Architecture**: See [ARCHITECTURE_BASELINE_V2.md](ARCHITECTURE_BASELINE_V2.md)

---

## 🎯 Next Steps

1. **TODAY**: Add environment variables to Railway (Phase 1)
2. **TODAY**: Verify deployment works (Phase 2)
3. **TODAY**: Test authentication flow (Phase 3)
4. **TOMORROW**: Set up monitoring and alerting
5. **WEEK 1**: Create staging environment
6. **WEEK 1**: Document backup and recovery procedures

---

**Last Updated**: May 4, 2026 09:52 AM UTC  
**Prepared by**: GitHub Copilot  
**Status**: ✅ READY FOR DEPLOYMENT
