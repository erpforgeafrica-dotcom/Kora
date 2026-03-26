# KÓRA Phase 04 - Quick Start Guide

## 🚀 Get AI Running in 5 Minutes

### Prerequisites Check
```powershell
# Verify installations
node --version      # Should be 16+
npm --version       # Should be 8+
docker --version    # Optional, for Redis

# Verify services running
netstat -ano | findstr ":3000"    # Backend should show LISTENING
netstat -ano | findstr ":5173"    # Frontend should show LISTENING
```

---

## ⚡ Step-by-Step Setup

### 1️⃣ Get Anthropic API Key (2 minutes)
```powershell
# CRITICAL: You need this to enable AI
# Visit: https://console.anthropic.com/
# 1. Sign up / Login
# 2. API Keys → Create Key
# 3. Copy the key (starts with sk-ant-)
```

### 2️⃣ Add API Key to Environment (1 minute)
```powershell
cd C:\Users\hp\KORA\backend

# Open .env in editor
# Find line: ANTHROPIC_API_KEY=sk-ant-...
# Replace with your actual key

# Example:
# ANTHROPIC_API_KEY=sk-ant-abc123def456ghi789jkl
```

### 3️⃣ Start Redis (1 minute)
```powershell
# Option A: Docker (easiest)
docker run -d -p 6379:6379 redis:7-alpine

# Option B: Local Redis
redis-server

# Option C: WSL
wsl redis-server
```

### 4️⃣ Initialize Database (30 seconds)
```powershell
# Connect to PostgreSQL and run schema
psql $DATABASE_URL < backend/src/db/schema.sql

# Or if you prefer, manually copy/paste from:
# backend/src/db/schema.sql
```

### 5️⃣ Restart Backend Services (30 seconds)
```powershell
# Terminal 1: Kill current backend (Ctrl+C)
cd backend
npm run dev

# Terminal 2 (new): Start anomaly detector
cd backend
npm run dev:worker

# Terminal 3: Leave frontend running
# Already at http://localhost:5173
```

---

## ✅ Verify Everything Works

```powershell
# Test 1: Health check
curl http://localhost:3000/health
# Expected: {"status":"ok","service":"kora-backend","timestamp":"2026-03-05T..."}

# Test 2: API with sample auth (you'll need real Bearer token)
curl -X GET http://localhost:3000/api/ai/insights `
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
# Expected: {"insights":[]} or error if no data yet

# Test 3: Check frontend
# Open: http://localhost:5173
# Look for: "AI Command Center" section with status badge
```

---

## 🎯 What You Can Do Now

### See AI Status
- Frontend shows "AI Orchestration Active" badge
- Pulsing green indicator = Claude connection ready

### Test Command Ranking
```powershell
curl -X POST http://localhost:3000/api/ai/rank-commands `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "commands": [
      {"id":"1", "title":"Emergency alert", "severity":"critical", "context":"Patient vitals"},
      {"id":"2", "title":"Invoice review", "severity":"low", "context":"Finance"}
    ]
  }'
```

### Monitor AI Usage
```sql
-- Check how many inferences logged
SELECT COUNT(*), SUM(cost_usd) 
FROM ai_requests 
WHERE organization_id = 'YOUR_ORG_ID';

-- Check budget status
SELECT monthly_limit_usd, current_month_spend_usd 
FROM ai_budgets 
WHERE organization_id = 'YOUR_ORG_ID';
```

---

## 🔧 Common Issues

### "Cannot connect to Redis"
```
Solution: Start Redis
docker run -d -p 6379:6379 redis:7-alpine
```

### "Anthropic API key invalid"
```
Solution: 
1. Get new key from https://console.anthropic.com/
2. Update .env: ANTHROPIC_API_KEY=sk-ant-...
3. Restart backend
```

### "Bearer token missing"
```
Solution: All /api/ai/* endpoints require auth
Add header: Authorization: Bearer <your_clerk_token>
```

### "Database table doesn't exist"
```
Solution: Initialize schema
psql $DATABASE_URL < backend/src/db/schema.sql
```

---

## 📊 AI Features Now Available

### 1. Command Ranking
```
POST /api/ai/rank-commands
→ Claude analyzes commands by business impact
→ Returns ordered list with reasoning
```

### 2. Cross-Module Insights
```
GET /api/ai/insights
→ Queries all 8 modules
→ Correlates data patterns
→ Returns top recommendations
```

### 3. Operational Forecasting
```
GET /api/ai/predictions
→ Predicts revenue, bookings, staffing
→ Provides confidence intervals
→ Updates as data flows in
```

### 4. Smart Suggestions
```
GET /api/ai/suggestions
→ Operations efficiency recommendations
→ Revenue growth opportunities
→ Compliance risk alerts
```

---

## 💰 Cost Tracking

Your API key allows limited usage. Monitor costs:

```powershell
# Check current spending
SELECT SUM(cost_usd) as total_spend
FROM ai_requests
WHERE created_at > NOW() - INTERVAL '1 month';

# Your monthly budget: $100 (default)
# Each operation: $0.003 - $0.008
# At default: ~500-1000 operations per month
```

---

## 🎓 Next Learning Steps

1. **Read the full docs**
   - PHASE_04_TRANSFORMATION_SUMMARY.md
   - PHASE_04_SETUP_CHECKLIST.md

2. **Explore the code**
   - backend/src/services/aiClient.ts (Claude wrapper)
   - backend/src/modules/ai/service.ts (Orchestration)
   - frontend/src/components/AICommandCenter.tsx (UI)

3. **Test in depth**
   - Try all 4 endpoints with real data
   - Monitor ai_requests table
   - Check latency in logs

4. **Plan integrations**
   - How will commands flow into ranking?
   - Which metrics for anomaly detection?
   - What predictions matter most?

---

## 🚀 You're Ready!

**Backend**: http://localhost:3000/api/ai/*
**Frontend**: http://localhost:5173
**Database**: PostgreSQL with 5 new AI tables ready
**API Key**: Set in backend/.env

**Questions?** See PHASE_04_SETUP_CHECKLIST.md (Troubleshooting section)

---

## 📋 Post-Setup Checklist

- [ ] API key added to .env
- [ ] Redis running
- [ ] Database schema initialized
- [ ] Backend restarted
- [ ] Anomaly worker running
- [ ] Health check passes
- [ ] Frontend loads
- [ ] At least one API call succeeds
- [ ] ai_requests table has entries
- [ ] cost_usd is calculated

**Once all checked**: ✅ Phase 04 is live!

---

**Made with ❤️ by KÓRA AI Engineering**
