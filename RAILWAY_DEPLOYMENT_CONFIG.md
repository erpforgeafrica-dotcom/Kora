# 🚂 Railway Deployment Configuration Guide for KORA

## 📋 Current Status
- ✅ **Backend API**: `https://kora-production-7661.up.railway.app/health` - RUNNING
- ⚠️ **Frontend**: Blank page (environment variables not configured)
- 🔧 **Issue**: Frontend build missing `VITE_CLERK_PUBLISHABLE_KEY` and other environment variables

---

## 🔧 Fix: Add Environment Variables to Railway

### Step 1: Access Your Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Select your **Kora** project
3. Navigate to your **Frontend Service** (if separate from backend)

### Step 2: Add Frontend Environment Variables

In your Railway service **Variables** tab, add these **REQUIRED** variables:

#### **Authentication (REQUIRED)**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_live_your_actual_clerk_key_here
```
Get this from: [Clerk Dashboard](https://dashboard.clerk.com) → API Keys

#### **API Configuration (REQUIRED)**
```
VITE_API_BASE_URL=https://kora-production-7661.up.railway.app
```

#### **Optional Configuration**
```
VITE_ORG_ID=org_production
VITE_APP_NAME=KORA Production
```

### Step 3: Add Backend Environment Variables

In your **Backend Service** Variables tab, ensure these are set:

#### **Database (REQUIRED)**
```
DATABASE_URL=postgresql://[your-db-connection-string]
```

#### **Redis (REQUIRED)**
```
REDIS_URL=redis://[your-redis-connection-string]
```

#### **Authentication Secrets (REQUIRED - generate new for production)**
```
JWT_SECRET=[generate-32-char-random-string]
SESSION_SECRET=[generate-32-char-random-string]
CLERK_SECRET_KEY=sk_live_your_actual_clerk_key
CLERK_AUTHORIZED_PARTIES=https://your-frontend-railway-url.up.railway.app
CLERK_WEBHOOK_SECRET=whsec_xxxxx
```

#### **CORS Configuration (REQUIRED)**
```
CORS_ORIGINS=https://your-frontend-railway-url.up.railway.app
API_BASE_URL=https://kora-production-7661.up.railway.app/api
```

#### **Payment Gateways (REQUIRED if using payments)**
```
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
PAYPAL_CLIENT_ID=xxxxx
PAYPAL_CLIENT_SECRET=xxxxx
FLUTTERWAVE_SECRET_KEY=xxxxx
PAYSTACK_SECRET_KEY=xxxxx
```

#### **AI Providers (at least one REQUIRED)**
```
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-xxxxx
# OR
OPENAI_API_KEY=sk-xxxxx
# OR
GOOGLE_API_KEY=AIza-xxxxx
```

#### **Feature Flags (REQUIRED)**
```
NODE_ENV=production
LOG_LEVEL=info
ENABLE_DEMO_MODE=false
ENABLE_MOCK_PAYMENTS=false
```

#### **Database Pooling (RECOMMENDED)**
```
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000
```

#### **Threat Detection (OPTIONAL - if enabled)**
```
THREAT_DETECTION_ENABLED=true
AUTO_RESPONSE_ENABLED=true
ANOMALY_SCAN_INTERVAL_MS=60000
SIGNAL_AGG_INTERVAL_MS=45000
```

---

## 🚀 Quick Railway Configuration Steps

### Option A: Manual Configuration (Recommended for first-time)

1. **Go to Railway Dashboard** → Your Kora Project
2. **Select each service** (Frontend, Backend, Worker) individually
3. **Click "Variables"** tab
4. **Copy-paste** each required variable from sections above
5. **Save changes** (Railway auto-redeploys on variable changes)

### Option B: Using Railway CLI

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Set environment variables
railway variables set VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
railway variables set VITE_API_BASE_URL=https://kora-production-7661.up.railway.app
railway variables set DATABASE_URL=postgresql://xxxxx
# ... repeat for all variables
```

### Option C: Using .env File with Railway

```bash
# Create .env.railway file with all production variables
# Then deploy with:
railway environment --env production
```

---

## ✅ Verification Checklist

After configuring variables, verify your deployment:

### 1. **Check Backend Health**
```bash
curl https://kora-production-7661.up.railway.app/health
```
Expected response:
```json
{
  "status": "ok",
  "service": "kora-backend",
  "version": "1.2.0",
  "environment": "Production"
}
```

### 2. **Check Frontend Loads**
```bash
curl https://your-frontend-url.up.railway.app/ | grep "<title>"
# Should output: <title>KORA Dashboard</title>
```

### 3. **Check Frontend Assets Load**
Open browser → DevTools (F12) → Network tab
- ✅ JavaScript files load (200 status)
- ✅ CSS files load (200 status)
- ✅ No console errors

### 4. **Check API Connectivity**
In browser console:
```javascript
fetch('https://kora-production-7661.up.railway.app/api/health')
  .then(r => r.json())
  .then(d => console.log(d))
```
Should work without CORS errors.

### 5. **Test Authentication Flow**
1. Visit frontend URL
2. Click "Sign In"
3. You should see Clerk authentication form (not error page)

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Only commit `.env.example`
2. **Rotate secrets regularly** - Update JWT_SECRET, SESSION_SECRET quarterly
3. **Use Railway's secret management** - All sensitive variables marked as `sync: false` won't sync between environments
4. **Enable HTTPS only** - All Railway URLs are HTTPS by default ✅
5. **Audit logs** - Check Railway dashboard → Logs for errors
6. **Rate limiting** - Backend has rate limiting enabled by default

---

## 🆘 Troubleshooting

### **Frontend Shows Blank Page**
**Cause**: Environment variables not set during build
**Fix**: 
1. Add `VITE_CLERK_PUBLISHABLE_KEY` to Railway Variables
2. Trigger redeploy: Go to Deployment tab → Click latest deployment → "Redeploy"

### **Cannot reach backend from frontend**
**Cause**: CORS or API URL misconfiguration
**Fix**:
1. Verify `VITE_API_BASE_URL` points to backend domain
2. Verify backend has `CORS_ORIGINS` set to frontend URL
3. Check Railway logs for CORS errors

### **500 Error on API calls**
**Cause**: Missing database or secrets
**Fix**:
1. Verify `DATABASE_URL` is correct
2. Check backend logs: Railway Dashboard → Logs tab
3. Verify `JWT_SECRET` and `SESSION_SECRET` are set

### **Authentication fails**
**Cause**: Clerk configuration mismatch
**Fix**:
1. Verify `VITE_CLERK_PUBLISHABLE_KEY` matches frontend
2. Verify `CLERK_SECRET_KEY` matches backend
3. Update Clerk dashboard → API Keys → Authorized Origins with your Railway URLs

---

## 📚 Related Documentation

- [Railway Docs](https://docs.railway.app)
- [Clerk Documentation](https://clerk.com/docs)
- [KORA Environment Variables Guide](./ENVIRONMENT_VARIABLES_GUIDE.md)
- [KORA Backend Setup](./backend/README.md)

---

## 🔄 Post-Deployment Checklist

- [ ] All environment variables added to Railway dashboard
- [ ] Frontend rebuilds after variable changes
- [ ] Backend health check returns `status: ok`
- [ ] Frontend page loads (no blank page)
- [ ] Login redirects to Clerk
- [ ] API calls succeed without CORS errors
- [ ] Database migrations run successfully
- [ ] No error logs in Railway dashboard

---

**Last Updated**: May 4, 2026 | **Status**: In Progress - Frontend Configuration Pending
