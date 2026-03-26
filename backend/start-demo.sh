#!/bin/bash

echo "🚀 Starting KÓRA in Demo Mode (No Database Required)"
echo ""

# Copy demo environment
cp .env.demo .env

echo "✅ Demo environment configured"
echo ""

# Start backend in demo mode
echo "🔧 Starting backend server..."
DEMO_MODE=true npm run dev