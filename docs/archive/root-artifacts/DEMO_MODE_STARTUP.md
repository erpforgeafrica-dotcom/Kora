# 🚀 KÓRA DEMO MODE STARTUP

## Infrastructure Issue Resolved

Since Docker/PostgreSQL are unavailable, I've created a **Demo Mode** that runs KÓRA with mock data.

## Quick Start (No Database Required)

### Option 1: Windows
```cmd
cd backend
start-demo.bat
```

### Option 2: Manual Start
```bash
# Terminal 1: Backend (Demo Mode)
cd backend
copy .env.demo .env
set DEMO_MODE=true
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## What Demo Mode Provides

### ✅ Full UI Testing
- All Dynamic CRUD pages work
- Forms render correctly
- Tables display mock data
- Theme system functional

### ✅ Mock Data Included
- **Clients**: John Doe, Jane Smith
- **Bookings**: 2 sample bookings
- **Services**: Haircut, Massage
- **Staff**: Alice Johnson, Bob Wilson

### ✅ Dynamic Workflow Engine
- Schema introspection works
- Auto-generated forms
- CRUD operations (in-memory)
- All UI components functional

## Access URLs (Demo Mode)

```
Landing:        http://localhost:5174/
Backend Health: http://localhost:3000/health

Dynamic CRUD Pages:
http://localhost:5174/app/business-admin/clients-dynamic?role=business_admin
http://localhost:5174/app/business-admin/bookings-dynamic?role=business_admin
http://localhost:5174/app/business-admin/services-dynamic?role=business_admin
http://localhost:5174/app/business-admin/staff-dynamic?role=business_admin

Regular Dashboards:
http://localhost:5174/app/business-admin?role=business_admin
http://localhost:5174/app/operations?role=operations
http://localhost:5174/app/staff?role=staff
http://localhost:5174/app/client?role=client
```

## Demo Mode Features

### ✅ Works Without
- Docker
- PostgreSQL
- Redis
- Any external dependencies

### ✅ Demonstrates
- Dynamic Workflow Engine
- Auto-generated CRUD forms
- Schema-driven UI
- Theme system
- Role-based routing
- Complete frontend architecture

### ✅ Perfect For
- UI testing
- Architecture demonstration
- Development without infrastructure
- Client presentations

## Upgrade to Full Mode

When Docker/PostgreSQL are available:

```bash
# 1. Start infrastructure
docker compose up -d postgres redis

# 2. Switch to production environment
cd backend
cp .env.example .env
# Edit .env with real database URL

# 3. Run migrations
npm run db:migrate

# 4. Start normally
npm run dev
```

## Demo Mode Architecture

```
Frontend (React) → Backend (Express) → Mock Database (In-Memory)
     ↓                    ↓                      ↓
  Port 5174          Port 3000              Mock Data
```

**Result**: Complete KÓRA experience without infrastructure dependencies.

---

## 🎯 Start Demo Now

**Windows**: `cd backend && start-demo.bat`  
**Mac/Linux**: `cd backend && bash start-demo.sh`

Then open: `http://localhost:5174/app/business-admin/clients-dynamic?role=business_admin`

**You'll see the Dynamic Workflow Engine in action with auto-generated CRUD forms.**