# INFRASTRUCTURE FIX SEQUENCE

## Current Blockers

### 🔴 CRITICAL
1. **Disk Space**: 0 GB free on C:
2. **Docker Desktop**: Not running

### Result
- Vite instances fail randomly (esbuild spawn errors)
- Backend cannot connect to PostgreSQL (ECONNREFUSED 127.0.0.1:5432)
- Redis unavailable
- Development workflow broken

---

## Fix Sequence (DO NOT SKIP STEPS)

### Step 1: Free Disk Space (MANDATORY)

**Target**: 5-10 GB free minimum

#### Safe Cleanup Locations
```powershell
# Windows Temp
rd /s /q %TEMP%

# NPM Cache
npm cache clean --force

# User cache directories
rd /s /q C:\Users\hp\.vite
rd /s /q C:\Users\hp\.cache
rd /s /q C:\Users\hp\AppData\Local\Temp
rd /s /q C:\Users\hp\AppData\Roaming\npm-cache

# Project-specific caches
cd C:\Users\hp\KORA
rd /s /q frontend\node_modules\.vite
rd /s /q backend\dist
rd /s /q frontend\dist
```

#### Verify Space
```powershell
wmic logicaldisk get size,freespace,caption
```

**Expected**: At least 5 GB free

---

### Step 2: Start Docker Desktop

1. Open Docker Desktop manually
2. Wait for "Docker Desktop is running" status
3. Verify:
```powershell
docker --version
docker ps
```

**Expected**: No errors

---

### Step 3: Start Infrastructure

```powershell
cd C:\Users\hp\KORA
docker compose up -d postgres redis
```

#### Verify Containers
```powershell
docker ps
```

**Expected Output**:
```
CONTAINER ID   IMAGE              STATUS
xxxxx          postgres:14        Up
xxxxx          redis:7-alpine     Up
```

#### Verify Connectivity
```powershell
# PostgreSQL
docker exec -it kora-postgres-1 psql -U postgres -c "SELECT 1"

# Redis
docker exec -it kora-redis-1 redis-cli ping
```

**Expected**: `1` and `PONG`

---

### Step 4: Setup Backend

```powershell
cd backend
npm install
cp .env.example .env
```

#### Edit .env
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kora_dev
REDIS_URL=redis://localhost:6379
CLERK_SECRET_KEY=your_clerk_key
PORT=3000
```

#### Run Migrations
```powershell
npm run db:migrate
```

**Expected**: All migrations applied successfully

#### Seed Database (Optional)
```powershell
npm run db:seed
```

---

### Step 5: Start Backend

```powershell
# Terminal 1
cd backend
npm run dev
```

**Expected Output**:
```
Server running on http://localhost:3000
Database connected
Redis connected
```

#### Verify Health
```powershell
curl http://localhost:3000/health
```

**Expected**:
```json
{
  "status": "ok",
  "service": "kora-backend",
  "timestamp": "2024-03-10T..."
}
```

---

### Step 6: Start Frontend

```powershell
# Terminal 2
cd frontend
npm install
npm run dev
```

**Expected Output**:
```
VITE v5.x.x ready in xxx ms
Local: http://localhost:5174/
```

---

### Step 7: Verify Dashboards

Open browser and test each URL:

```
✅ Landing:        http://localhost:5174/
✅ Client:         http://localhost:5174/app/client?role=client
✅ Business Admin: http://localhost:5174/app/business-admin?role=business_admin
✅ Staff:          http://localhost:5174/app/staff?role=staff
✅ Operations:     http://localhost:5174/app/operations?role=operations
✅ Platform Admin: http://localhost:5174/app/kora-admin?role=platform_admin
```

**Expected**: All dashboards load without errors

---

## Troubleshooting

### Issue: Docker Compose Fails
```
unable to get image 'postgres:14-alpine'
```

**Fix**:
1. Ensure Docker Desktop is running
2. Check internet connection
3. Pull images manually:
```powershell
docker pull postgres:14-alpine
docker pull redis:7-alpine
```

### Issue: Port Already in Use
```
EADDRINUSE: address already in use :::3000
```

**Fix**:
```powershell
# Find process
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F
```

### Issue: Database Connection Refused
```
ECONNREFUSED 127.0.0.1:5432
```

**Fix**:
1. Verify PostgreSQL container is running: `docker ps`
2. Check logs: `docker logs kora-postgres-1`
3. Restart container: `docker restart kora-postgres-1`

### Issue: Vite Fails to Start
```
Error: ENOSPC: no space left on device
```

**Fix**: Return to Step 1 (free disk space)

---

## Post-Fix Verification Checklist

- [ ] Disk space > 5 GB
- [ ] Docker Desktop running
- [ ] PostgreSQL container up
- [ ] Redis container up
- [ ] Backend running on :3000
- [ ] Frontend running on :5174
- [ ] Health endpoint responds
- [ ] All 6 dashboard URLs load
- [ ] No console errors

---

## Development Workflow (After Fix)

### Daily Startup
```powershell
# 1. Ensure Docker Desktop is running

# 2. Start infrastructure (if not already running)
docker compose up -d postgres redis

# 3. Start backend (Terminal 1)
cd backend && npm run dev

# 4. Start frontend (Terminal 2)
cd frontend && npm run dev
```

### Daily Shutdown
```powershell
# Stop dev servers (Ctrl+C in terminals)

# Stop containers (optional, can leave running)
docker compose down
```

---

## Why Single Frontend Instance Works

### Old Approach (BROKEN)
```
5 Vite instances × 5 roles = 5 processes
Ports: 5174, 5175, 5176, 5177, 5178
Problem: Disk space exhaustion, spawn failures
```

### New Approach (WORKING)
```
1 Vite instance + ?role= query param
Port: 5174 only
Benefit: Stable, low resource usage
```

### Implementation
```typescript
// frontend/src/auth/dashboardAccess.ts
export function getUserRole(): UserRole {
  // 1. Check URL query param (dev override)
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get("role");
  if (roleParam) return roleParam as UserRole;
  
  // 2. Check Clerk auth (production)
  const { user } = useUser();
  return user?.publicMetadata?.role || "client";
}
```

### Production Safety
```typescript
// Disable query param override in production
if (process.env.NODE_ENV === "production") {
  // Ignore ?role=, use Clerk only
  return user?.publicMetadata?.role || "client";
}
```

---

## Authentication Flow (Clerk)

### Expected Flow
```
User visits site
↓
Login/Signup (Clerk)
↓
JWT issued
↓
Backend verifies JWT
↓
Role determined from Clerk metadata
↓
Redirect to role-specific dashboard
```

### Roles
```typescript
type UserRole = 
  | "client"           // End users
  | "staff"            // Service providers
  | "business_admin"   // Business owners
  | "operations"       // Operations managers
  | "platform_admin";  // KÓRA admins
```

### Dev Override (Local Only)
```
?role=business_admin
```

Bypasses Clerk for local testing.

**MUST BE DISABLED IN PRODUCTION.**

---

## Next Steps After Infrastructure Fix

### Week 1: Foundation (Team B)
1. Create base UI library
   - Button, Input, Select, Modal, Card, Table
2. Consolidate media upload components
3. Create form framework
   - FormLayout, FormSection, FormField, FormActions

### Week 2-3: CRUD Completion (Team B)
4. Complete booking workflow UI
5. Build POS payment interface
6. Add missing action buttons
   - Check-in, Check-out, Assign Staff, Reschedule, Refund

### Week 4+: Optimization (Both Teams)
7. Implement React Query
8. Add E2E testing (Playwright)
9. Performance optimization
10. Production deployment

---

## Success Criteria

### Infrastructure ✅
- [ ] 0 Docker errors
- [ ] 0 database connection errors
- [ ] 0 Vite spawn failures
- [ ] All 6 dashboards load reliably

### Development ✅
- [ ] Backend hot reload works
- [ ] Frontend hot reload works
- [ ] No random crashes
- [ ] Consistent startup time

### Architecture ✅
- [ ] Single frontend instance stable
- [ ] Role routing works
- [ ] Theme system intact
- [ ] No component duplication

---

**Status**: READY TO FIX  
**Estimated Time**: 30 minutes  
**Blocker**: Disk space + Docker Desktop  
**Next**: Execute Step 1
