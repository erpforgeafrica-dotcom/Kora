# 🔑 KORA Render Environment Variables Reference

**Complete guide to all environment variables needed for Render deployment**

---

## 📋 Quick Reference: Required vs Optional

| Variable | Required | Scope | Type |
|----------|----------|-------|------|
| DATABASE_URL | ✅ YES | Backend + Worker | String (PostgreSQL) |
| REDIS_URL | ✅ YES | Backend + Worker | Auto-linked from service |
| JWT_SECRET | ✅ YES | Backend + Worker | String (32+ chars) |
| SESSION_SECRET | ✅ YES | Backend + Worker | String (32+ chars) |
| CLERK_SECRET_KEY | ✅ YES | Backend + Worker | String (sk_test_*) |
| CLERK_AUTHORIZED_PARTIES | ✅ YES | Backend | Frontend URL |
| NODE_ENV | ✅ YES | All | production \| staging |
| ANTHROPIC_API_KEY | ⚠️ CONDITIONAL | Backend | sk-ant-* (need one AI provider) |
| OPENAI_API_KEY | ⚠️ CONDITIONAL | Backend | sk-* (need one AI provider) |
| VITE_API_BASE_URL | ✅ YES | Frontend | Backend API URL |
| VITE_CLERK_PUBLISHABLE_KEY | ✅ YES | Frontend | pk_test_* |

---

## 🔐 Production Environment Variables

### Database & Cache

**DATABASE_URL**
```
postgresql://postgres.zihocnhvtgodnawnvoyj:KoraDB2024secure@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```
- Source: Supabase Production instance
- Required for: Backend + Worker
- Action: Copy from Supabase dashboard

**REDIS_URL**
```
(auto-linked from render.yaml)
```
- Source: Render Redis service
- Required for: Backend + Worker
- Action: Auto-linked in render.yaml ✓

---

### Authentication & Session Management

**JWT_SECRET**
```
Generate a random 32+ character string
Example: openssl rand -hex 16
```
- Required for: Backend + Worker
- Used for: JWT token signing/verification
- ⚠️ Keep secret! Never commit.

**SESSION_SECRET**
```
Generate a random 32+ character string
```
- Required for: Backend + Worker
- Used for: Session cookie encryption
- ⚠️ Keep secret! Never commit.

**CLERK_SECRET_KEY**
```
sk_test_Hkd6sNcwj9C4tQ8VOMUAbSv3HjimNEYxndUz5ffK7p
```
- Source: Clerk dashboard → API Keys → Backend Secret
- Required for: Backend + Worker
- ⚠️ Keep secret! Use test key for staging, live key for production

**CLERK_AUTHORIZED_PARTIES**
```
https://kora-frontend.onrender.com
```
- Source: Your frontend URL on Render
- Required for: Backend
- Used for: CORS validation for Clerk sessions

**CLERK_WEBHOOK_SECRET**
```
Set in Render Environment as needed
```
- Source: Clerk dashboard → Webhooks → Signing Secret
- Required for: Backend (optional, for webhook validation)
- Action: Add if you use Clerk webhooks

---

### Payment Gateways

**STRIPE_SECRET_KEY**
```
sk_live_your_actual_stripe_key
```
- Source: Stripe dashboard → API Keys
- Required for: Backend + Worker
- Action: Use live key for production

**STRIPE_WEBHOOK_SECRET**
```
whsec_test_your_webhook_secret
```
- Source: Stripe dashboard → Webhooks
- Required for: Backend (optional, for webhook validation)
- Action: Add if you use Stripe webhooks

---

### Frontend Configuration

**VITE_API_BASE_URL**
```
https://kora-backend.onrender.com
```
- Source: Your backend URL on Render
- Required for: Frontend build
- Used for: API client base URL

**VITE_CLERK_PUBLISHABLE_KEY**
```
pk_test_Y2xvdWQtOXN0YWcuY2xlcmsuYWNjb3VudHMuZGV2
```
- Source: Clerk dashboard → API Keys → Frontend API Key
- Required for: Frontend build
- Used for: Clerk authentication UI

---

### AI Provider Configuration

**ANTHROPIC_API_KEY** (Recommended for Production)
```
sk-ant-v7-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Source: Claude.ai → Account Settings → API Keys
- Required for: Backend (one provider minimum)
- Used for: AI orchestration with Anthropic Claude

**OPENAI_API_KEY** (Alternative/Backup)
```
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Source: OpenAI dashboard → API Keys
- Required for: Backend (if not using Anthropic)
- Used for: AI orchestration with GPT-4

**GOOGLE_API_KEY** (Alternative)
```
AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Source: Google Cloud Console → API Keys
- Required for: Backend (if not using other providers)
- Used for: AI orchestration with Gemini

**MISTRAL_API_KEY** (Alternative)
```
Set if you use Mistral AI
```
- Source: Mistral AI console
- Required for: Backend (if not using other providers)
- Used for: AI orchestration with Mistral

**AI_BUDGET_USD_MONTHLY**
```
100
```
- Default: 100 USD/month
- Used for: Cost control across all AI providers
- Action: Adjust based on usage

---

### CORS & API Configuration

**CORS_ORIGINS**
```
https://kora-frontend.onrender.com
```
- Required for: Backend
- Used for: CORS header validation
- Format: Single URL or comma-separated list

**API_BASE_URL**
```
https://kora-backend.onrender.com/api
```
- Required for: Backend (logging, external references)
- Used for: API documentation, error responses

---

### Monitoring & Logging

**LOG_LEVEL**
```
info (production) | debug (staging)
```
- Default: info
- Values: debug, info, warn, error
- Used for: Log verbosity control

**SENTRY_DSN** (Optional)
```
https://xxxxx@sentry.io/xxxxx
```
- Source: Sentry dashboard → Projects → DSN
- Used for: Error tracking and monitoring
- Optional: Leave empty if not using Sentry

---

### Feature Flags (Production)

**ENABLE_DEMO_MODE**
```
false (production) | true (staging)
```
- Used for: Demo data and mock functionality
- Production: false (always)

**ENABLE_MOCK_PAYMENTS**
```
false (production) | true (staging)
```
- Used for: Mock payment processing
- Production: false (always)

---

## 🎯 Staging Environment Variables

Same as production, except:

| Variable | Production | Staging |
|----------|-----------|---------|
| NODE_ENV | production | staging |
| LOG_LEVEL | info | debug |
| ENABLE_DEMO_MODE | false | true |
| ENABLE_MOCK_PAYMENTS | false | true |
| DATABASE_URL | prod Supabase | staging Supabase |
| CLERK_SECRET_KEY | sk_test_* | sk_test_* (test) |
| STRIPE_SECRET_KEY | sk_live_* | sk_test_* (test) |

---

## 🚀 Setup Instructions

### Step 1: Generate Random Secrets

```bash
# On your local machine, generate these:

# JWT_SECRET (32+ chars)
openssl rand -hex 16
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# SESSION_SECRET (32+ chars)
openssl rand -hex 16
# Output: z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

### Step 2: Set in Render Dashboard

1. Go to **Render Dashboard** → **Dashboard**
2. Click your service: **kora-backend**
3. Go to **Environment**
4. Add variables (paste from above):

```
DATABASE_URL=postgresql://...
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
SESSION_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4
CLERK_SECRET_KEY=sk_test_...
CLERK_AUTHORIZED_PARTIES=https://kora-frontend.onrender.com
VITE_API_BASE_URL=https://kora-backend.onrender.com
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
ANTHROPIC_API_KEY=sk-ant-...
...
```

### Step 3: Deploy

```bash
git add render.yaml
git commit -m "ci: update render configuration"
git push origin main
```

Render auto-detects and deploys.

---

## ✅ Validation Checklist

Before deploying, verify:

- [ ] DATABASE_URL set to production Supabase
- [ ] JWT_SECRET is 32+ random characters
- [ ] SESSION_SECRET is 32+ random characters
- [ ] CLERK_SECRET_KEY matches Clerk dashboard
- [ ] VITE_API_BASE_URL matches backend Render URL
- [ ] ANTHROPIC_API_KEY or OPENAI_API_KEY set (at least one)
- [ ] No hardcoded secrets in render.yaml
- [ ] All frontend env vars start with VITE_
- [ ] NODE_ENV=production for production
- [ ] ENABLE_DEMO_MODE=false for production

---

## 🔄 Updating Environment Variables

### Via Render Dashboard (Recommended)

1. Dashboard → Service → Environment
2. Edit variable inline or bulk-paste
3. Changes auto-trigger redeploy

### Via CLI

```bash
render env set DATABASE_URL=new_value --service kora-backend
```

### Via render.yaml

- Only for non-secret, non-environment-specific values
- Secrets should use `sync: false` (dashboard only)

---

## 🛡️ Security Best Practices

1. ✅ **Never hardcode secrets in render.yaml**
2. ✅ **Use Render's secrets manager** (Environment tab)
3. ✅ **Rotate secrets regularly** (quarterly minimum)
4. ✅ **Different secrets for prod vs staging**
5. ✅ **Different API keys per environment** (Stripe test key for staging)
6. ✅ **Use strong random generation** (openssl rand -hex 32)
7. ✅ **Log rotation** enabled (Render default)
8. ✅ **No secrets in Git history** (.gitignore ✓)

---

## 🆘 Troubleshooting

### "Database connection failed"
- Verify DATABASE_URL is correct
- Check Supabase connection pooling is enabled
- Verify IP allowlist (if applicable)

### "Unauthorized: JWT validation failed"
- Check JWT_SECRET matches backend/worker
- Verify token not expired (JWT_EXPIRY_HOURS)

### "Clerk authentication failed"
- Check CLERK_SECRET_KEY is valid
- Verify CLERK_AUTHORIZED_PARTIES matches frontend URL
- Check Clerk webhook endpoints configured

### "API returns 403 CORS error"
- Verify CORS_ORIGINS matches frontend URL exactly
- Include protocol: https://
- No trailing slash

### "AI calls failing"
- Verify API key format (sk-ant-, sk-, etc.)
- Check API key is active in provider dashboard
- Verify AI_BUDGET_USD_MONTHLY not exceeded

---

## 📚 Reference Links

- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
- Clerk Docs: https://clerk.com/docs
- Stripe Docs: https://stripe.com/docs
- Anthropic Claude: https://console.anthropic.com

