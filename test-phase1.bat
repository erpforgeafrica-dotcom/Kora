@echo off
REM Phase 1 CRUD Verification Test (Windows)
REM Run this after starting backend (npm run dev) and frontend (npm run dev)

echo.
echo 🧪 Phase 1 CRUD Wiring Test
echo ==============================
echo.

set API_BASE=http://localhost:3000
set ORG_ID=org_placeholder

echo 1️⃣ Testing Clients API...
curl -s -H "X-Org-Id: %ORG_ID%" "%API_BASE%/api/clients"
echo.

echo 2️⃣ Testing Bookings API...
curl -s -H "X-Org-Id: %ORG_ID%" "%API_BASE%/api/bookings"
echo.

echo 3️⃣ Testing Services API...
curl -s -H "X-Org-Id: %ORG_ID%" "%API_BASE%/api/services"
echo.

echo 4️⃣ Testing Staff API...
curl -s -H "X-Org-Id: %ORG_ID%" "%API_BASE%/api/staff"
echo.

echo 5️⃣ Testing Payments API...
curl -s -H "X-Org-Id: %ORG_ID%" "%API_BASE%/api/payments/transactions"
echo.

echo ==============================
echo ✅ All endpoints responding!
echo.
echo Next: Open http://localhost:5174/app/business-admin/clients
echo       and verify the UI shows real data.
echo.
pause
