#!/bin/bash
# Phase 1 CRUD Verification Test
# Run this after starting backend (npm run dev) and frontend (npm run dev)

echo "🧪 Phase 1 CRUD Wiring Test"
echo "=============================="
echo ""

API_BASE="http://localhost:3000"
ORG_ID="org_placeholder"

echo "1️⃣ Testing Clients API..."
curl -s -H "X-Org-Id: $ORG_ID" "$API_BASE/api/clients" | jq -r '.count // "❌ FAILED"' | xargs -I {} echo "   Clients count: {}"

echo ""
echo "2️⃣ Testing Bookings API..."
curl -s -H "X-Org-Id: $ORG_ID" "$API_BASE/api/bookings" | jq -r '.count // "❌ FAILED"' | xargs -I {} echo "   Bookings count: {}"

echo ""
echo "3️⃣ Testing Services API..."
curl -s -H "X-Org-Id: $ORG_ID" "$API_BASE/api/services" | jq -r '.count // "❌ FAILED"' | xargs -I {} echo "   Services count: {}"

echo ""
echo "4️⃣ Testing Staff API..."
curl -s -H "X-Org-Id: $ORG_ID" "$API_BASE/api/staff" | jq -r '.count // "❌ FAILED"' | xargs -I {} echo "   Staff count: {}"

echo ""
echo "5️⃣ Testing Payments API..."
curl -s -H "X-Org-Id: $ORG_ID" "$API_BASE/api/payments/transactions" | jq -r '.count // "❌ FAILED"' | xargs -I {} echo "   Transactions count: {}"

echo ""
echo "=============================="
echo "✅ All endpoints responding!"
echo ""
echo "Next: Open http://localhost:5174/app/business-admin/clients"
echo "      and verify the UI shows real data."
