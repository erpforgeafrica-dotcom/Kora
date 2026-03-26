# KÓRA Phase 6 - Quick Start Guide

## ⚡ Start Everything in 30 Seconds

### Option 1: Docker Compose (Recommended)
```bash
cd c:\Users\hp\KORA
docker-compose up -d
```

This starts:
- ✅ PostgreSQL (port 5432)
- ✅ Redis (port 6379)
- ✅ Backend API (port 3000)
- ✅ Worker Service (background jobs)

Then open: **http://localhost:5173**

### Option 2: Manual Start (Development)

**Terminal 1 - Frontend**:
```bash
cd c:\Users\hp\KORA\frontend
npm run dev
# Opens on http://localhost:5173
```

**Terminal 2 - Backend** (after Redis is running):
```bash
cd c:\Users\hp\KORA\backend
npm run start
# Listens on http://localhost:3000
```

**Terminal 3 - Redis** (if not in Docker):
```bash
redis-server --port 6379
```

---

## 🎯 Access Each Dashboard

| Dashboard | URL | User | Purpose |
|-----------|-----|------|---------|
| **B1: Client Portal** | http://localhost:5173/app/client | Customer | Book appointments, view loyalty |
| **B2: Business Admin** | http://localhost:5173/app/business-admin | Owner | View revenue, capacity, KPIs |
| **B3: Staff Workspace** | http://localhost:5173/app/staff | Staff | Daily operations, calendar |
| **B4: Kora Admin** | http://localhost:5173/app/kora-admin | Admin | Platform health, AI spend |

---

## 🧪 Test the Dashboards

### B1: Client Portal
1. Navigate to http://localhost:5173/app/client
2. See Amara Stone's profile (mock data)
3. View upcoming appointment: "Deep Tissue Massage"
4. Try tabs: Upcoming → History → Balances → Loyalty
5. Click "What to Expect" to see AI brief

### B2: Business Admin
1. Navigate to http://localhost:5173/app/business-admin
2. View KPIs: Revenue (£4,820), Capacity (82.4%), No-shows (6.5%)
3. See revenue trend chart
4. Check AI alerts for conflicts/capacity
5. Review churn risk clients

### B3: Staff Workspace (Operations Command)
1. Navigate to http://localhost:5173/app/staff
2. See 3-zone layout:
   - Top: Metrics bar (bookings, revenue, capacity, check-ins)
   - Middle: Calendar grid with staff columns
   - Bottom: Analytics (revenue/hour, staff util, top services)
3. View appointments: Sarah Chen, Emma Wilson, Marcus Johnson
4. Try: Click appointment → See status
5. Try: Hover over staff util → See breakdown

### B4: Kora Admin
1. Navigate to http://localhost:5173/app/kora-admin
2. See tenant health table (Demo Organization)
3. View AI spend summary donut chart
4. Check system health banner (green = healthy)

---

## 📊 Test API Endpoints

### Get Client Profile
```bash
curl -X GET http://localhost:3000/api/clients/demo-client-1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Business Summary
```bash
curl -X GET http://localhost:3000/api/analytics/business-summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Staff Performance
```bash
curl -X GET http://localhost:3000/api/analytics/staff-performance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Today's Schedule
```bash
curl -X GET http://localhost:3000/api/staff/today-schedule \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🛠️ Troubleshooting

### Problem: "Network error" on Dashboard
**Solution**: Start backend API:
```bash
cd backend && npm run start
# Make sure Redis is running first!
```

### Problem: "Redis connection refused"
**Solution**: Start Redis:
```bash
# Option 1: Docker
docker run -d -p 6379:6379 redis:latest

# Option 2: Direct (if installed)
redis-server
```

### Problem: "PostgreSQL connection refused"
**Solution**: Start PostgreSQL:
```bash
# Option: Docker
docker run -d \
  -e POSTGRES_DB=kora \
  -e POSTGRES_USER=kora \
  -e POSTGRES_PASSWORD=kora \
  -p 5432:5432 \
  postgres:16-alpine
```

### Problem: TypeScript errors on frontend
**Solution**: Run type check:
```bash
cd frontend
npm run typecheck
# Should show: 0 errors
```

### Problem: Build fails
**Solution**: Clean and rebuild:
```bash
cd frontend
npm ci
npm run build
```

---

## 🚀 Performance Checklist

- [x] Frontend builds in <5 seconds
- [x] Dashboard pages load in <3 seconds
- [x] Calendar grid renders 30 appointments smoothly
- [x] API responses <500ms
- [x] 0 TypeScript errors
- [x] Mobile responsive design
- [x] Dark mode support

---

## 📋 Production Deployment

### Before Going Live

1. **Environment Variables**:
   ```bash
   # backup/.env.production
   VITE_API_URL=https://api.kora.example.com
   VITE_AUTH_DOMAIN=auth.kora.example.com
   ```

2. **Database Migration**:
   ```bash
   cd backend
   npm run migrate
   ```

3. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   # Outputs to dist/
   ```

4. **Start Services**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Verify Health**:
   ```bash
   curl https://api.kora.example.com/health
   # Should return: { "status": "ok" }
   ```

---

## 📚 Documentation Files

| Document | Purpose |
|----------|---------|
| [PHASE_06_COMPLETION_REPORT.md](PHASE_06_COMPLETION_REPORT.md) | Full feature documentation |
| [SPRINT_A2_IMPLEMENTATION_SUMMARY.md](SPRINT_A2_IMPLEMENTATION_SUMMARY.md) | Backend API details |
| [README.md](README.md) | General project overview |

---

## 🎓 Development Guide

### Add New Dashboard Page

1. Create page component:
   ```typescript
   // frontend/src/pages/audience/MyDashboardPage.tsx
   export function MyDashboardPage() {
     return <MyDashboard />;
   }
   ```

2. Add route in App.tsx:
   ```typescript
   <Route path="my-dashboard" element={<MyDashboardPage />} />
   ```

3. Add navigation item in AppShell.tsx:
   ```typescript
   { icon: "◈", label: "My Dashboard", path: "/app/my-dashboard", key: "my-dashboard" }
   ```

### Add New API Endpoint

1. Create route:
   ```typescript
   // backend/src/modules/mymodule/routes.ts
   router.get('/my-endpoint', authenticate, async (req, res) => {
     // implementation
   });
   ```

2. Add type definition:
   ```typescript
   // frontend/src/types/api.ts
   export interface MyResponse {
     // fields with guaranteed types
   }
   ```

3. Call from dashboard:
   ```typescript
   const response = await fetch('/api/my-endpoint');
   const data: MyResponse = await response.json();
   ```

---

## 🎯 What's Next?

### Phase 7: Advanced Features
- [ ] Drag-to-reschedule appointments
- [ ] Command palette (⌘K)
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics & custom reports
- [ ] Mobile app (React Native)

### Phase 8: Production Hardening
- [ ] Load testing (k6)
- [ ] Security audit (OWASP)
- [ ] Performance optimization (Core Web Vitals)
- [ ] Disaster recovery setup
- [ ] Multi-region deployment

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review PHASE_06_COMPLETION_REPORT.md
3. Check backend logs: `docker logs kora-backend`
4. Check frontend console: Press F12 → Console tab

---

**Last Updated**: March 7, 2026  
**Status**: READY FOR TESTING  
**Version**: v0.4 BETA
