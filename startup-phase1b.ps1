# KORA Phase 1B Startup Script
# Prerequisites: Docker Desktop running, PostgreSQL/Redis containers available
# Purpose: Launch infrastructure, apply migrations, start servers

Write-Host "=== KORA Phase 1B Startup ===" -ForegroundColor Cyan
Write-Host ""

# Colors for output
$successColor = "Green"
$errorColor = "Red"
$infoColor = "Cyan"
$warningColor = "Yellow"

# Step 1: Check Docker
Write-Host "STEP 1: Checking Docker..." -ForegroundColor $infoColor
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK Docker: $dockerVersion" -ForegroundColor $successColor
    } else {
        Write-Host "Docker not available. Starting services without Docker." -ForegroundColor $warningColor
    }
} catch {
    Write-Host "Docker not available. Starting services without Docker." -ForegroundColor $warningColor
}

# Step 2: Start infrastructure
Write-Host ""
Write-Host "STEP 2: Starting infrastructure (PostgreSQL + Redis)..." -ForegroundColor $infoColor
cd c:\Users\hp\KORA
docker compose up -d postgres redis
Start-Sleep -Seconds 3
docker ps --format "table {{.Names}}\t{{.Status}}"

# Step 3: Apply database migrations
Write-Host ""
Write-Host "STEP 3: Applying database migrations..." -ForegroundColor $infoColor
cd c:\Users\hp\KORA\backend
Write-Host "Running: npm run db:migrate" -ForegroundColor $infoColor
npm run db:migrate

# Step 4: Display URLs
Write-Host ""
Write-Host "=== SERVICES READY ===" -ForegroundColor $successColor
Write-Host "Backend API: http://localhost:3000" -ForegroundColor $infoColor
Write-Host "Frontend: http://localhost:5173" -ForegroundColor $infoColor
Write-Host "PostgreSQL: localhost:5432" -ForegroundColor $infoColor
Write-Host "Redis: localhost:6379" -ForegroundColor $infoColor
Write-Host ""
Write-Host "STEP 5: To start services, run in separate terminals:" -ForegroundColor $infoColor
Write-Host "Backend:  cd c:\Users\hp\KORA\backend; npm run dev" -ForegroundColor $warningColor
Write-Host "Frontend: cd c:\Users\hp\KORA\frontend; npm run dev" -ForegroundColor $warningColor
Write-Host ""
Write-Host "STEP 6: Test endpoints with curl commands:" -ForegroundColor $infoColor
Write-Host "Register User:" -ForegroundColor $warningColor
Write-Host "curl -X POST http://localhost:3000/api/auth/register -H 'Content-Type: application/json' -d '{""email"":""test@example.com"",""password"":""password123"",""full_name"":""Test User""}'" -ForegroundColor $warningColor
Write-Host ""
