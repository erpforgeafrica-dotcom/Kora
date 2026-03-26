@echo off
echo 🚀 Starting KÓRA in Demo Mode (No Database Required)
echo.

REM Copy demo environment
copy .env.demo .env

echo ✅ Demo environment configured
echo.

REM Start backend in demo mode
echo 🔧 Starting backend server...
set DEMO_MODE=true
npm run dev