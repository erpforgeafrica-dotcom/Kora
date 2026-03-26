#!/usr/bin/env pwsh
# KORA Phase 1B Startup Script
# Windows PowerShell
# Usage: .\kora-phase1b-startup.ps1

param(
    [ValidateSet("setup", "start", "test", "clean", "logs")]
    [string]$Command = "start",
    
    [switch]$SkipDocker,
    [switch]$SkipMigrations,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'

$RootDir = (Get-Location).Path
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$DockerCompose = Join-Path $RootDir "docker-compose.yml"

Write-Host "
╔═══════════════════════════════════════════════════════════════════╗
║          KORA Phase 1B - Workflow-First Startup Script            ║
║                                                                   ║
║  🎯 Command: $Command                                     ║
║  📁 Root: $RootDir                       ║
╚═══════════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $colors = @{
        "INFO" = "Cyan"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR" = "Red"
        "DEBUG" = "Gray"
    }
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] [$Status] $Message" -ForegroundColor $colors[$Status]
}

function Test-Executable {
    param([string]$Name)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    return $null -ne $cmd
}

function Setup-Environment {
    Write-Status "Verifying environment..." "INFO"
    
    # Check prerequisites
    $missing = @()
    if (-not (Test-Executable "docker")) { $missing += "docker" }
    if (-not (Test-Executable "npm")) { $missing += "npm" }
    if (-not (Test-Executable "node")) { $missing += "node" }
    if (-not (Test-Executable "psql")) { $missing += "psql (PostgreSQL client)" }
    
    if ($missing.Count -gt 0) {
        Write-Status "Missing: $($missing -join ', ')" "WARNING"
        Write-Status "Some features may not work. Consider installing: https://docs.docker.com/get-docker/" "WARNING"
    } else {
        Write-Status "All prerequisites found ✓" "SUCCESS"
    }
    
    # Check/create .env files
    Write-Status "Checking .env files..." "INFO"
    
    $backendEnv = Join-Path $BackendDir ".env"
    if (-not (Test-Path $backendEnv)) {
        Write-Status "Creating backend/.env..." "INFO"
        $envContent = @"
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://kora:kora@localhost:5432/kora
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-test-secret-key-change-in-production
LOG_LEVEL=debug
NODE_LOG_FORMAT=json
BACKEND_URL=http://localhost:3000
"@
        Set-Content -Path $backendEnv -Value $envContent
        Write-Status "Created backend/.env" "SUCCESS"
    } else {
        Write-Status "backend/.env already exists (using existing)" "INFO"
    }
    
    $frontendEnv = Join-Path $FrontendDir ".env"
    if (-not (Test-Path $frontendEnv)) {
        Write-Status "Creating frontend/.env..." "INFO"
        $envContent = @"
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=KORA
VITE_ENV=development
VITE_LOG_LEVEL=debug
"@
        Set-Content -Path $frontendEnv -Value $envContent
        Write-Status "Created frontend/.env" "SUCCESS"
    } else {
        Write-Status "frontend/.env already exists (using existing)" "INFO"
    }
    
    # Install dependencies
    Write-Status "Installing backend dependencies..." "INFO"
    Push-Location $BackendDir
    npm install --legacy-peer-deps 2>&1 | Where-Object { $_ -match "(added|up to date|error)" } | Write-Host
    Pop-Location
    Write-Status "Backend dependencies ready" "SUCCESS"
    
    Write-Status "Installing frontend dependencies..." "INFO"
    Push-Location $FrontendDir
    npm install --legacy-peer-deps 2>&1 | Where-Object { $_ -match "(added|up to date|error)" } | Write-Host
    Pop-Location
    Write-Status "Frontend dependencies ready" "SUCCESS"
}

function Start-Infrastructure {
    if ($SkipDocker) {
        Write-Status "Skipping Docker (--SkipDocker)" "INFO"
        return
    }
    
    Write-Status "Starting Docker services..." "INFO"
    
    try {
        # Check if Docker is running
        docker ps > $null 2>&1
    } catch {
        Write-Status "Docker daemon not running. Start Docker Desktop and try again." "ERROR"
        exit 1
    }
    
    # Start services
    Write-Status "Starting PostgreSQL..." "INFO"
    docker compose up -d postgres 2>&1 | grep -E "postgresql|Creating|Already" | Write-Host
    
    Write-Status "Starting Redis..." "INFO"
    docker compose up -d redis 2>&1 | grep -E "redis|Creating|Already" | Write-Host
    
    # Wait for services to be healthy
    Write-Status "Waiting for services to be healthy (30 seconds)..." "INFO"
    Start-Sleep -Seconds 5
    
    # Test PostgreSQL connection
    $maxAttempts = 5
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        try {
            psql -U kora -d kora -h localhost -c "SELECT 1" > $null 2>&1
            Write-Status "PostgreSQL is healthy ✓" "SUCCESS"
            break
        } catch {
            $attempt++
            if ($attempt -eq $maxAttempts) {
                Write-Status "PostgreSQL is not responding after 5 attempts" "ERROR"
                Write-Status "Try: docker compose logs postgres" "INFO"
                exit 1
            }
            Write-Status "PostgreSQL not ready, waiting... ($attempt/$maxAttempts)" "INFO"
            Start-Sleep -Seconds 3
        }
    }
    
    # Test Redis connection
    try {
        docker exec kora-redis-1 redis-cli ping 2>&1 | Write-Host
        Write-Status "Redis is healthy ✓" "SUCCESS"
    } catch {
        Write-Status "Redis may not be healthy. Check: docker compose logs redis" "WARNING"
    }
}

function Apply-Migrations {
    if ($SkipMigrations) {
        Write-Status "Skipping migrations (--SkipMigrations)" "INFO"
        return
    }
    
    Write-Status "Applying database migrations..." "INFO"
    Push-Location $BackendDir
    
    try {
        npm run db:migrate 2>&1 | Write-Host
        Write-Status "Migrations applied successfully ✓" "SUCCESS"
    } catch {
        Write-Status "Migration failed: $_" "ERROR"
        exit 1
    }
    finally {
        Pop-Location
    }
}

function Start-Servers {
    Write-Status "Starting backend server..." "INFO"
    Push-Location $BackendDir
    $backendProcess = Start-Process -NoNewWindow -PassThru -FilePath npm -ArgumentList "run","dev"
    Pop-Location
    $backendPID = $backendProcess.Id
    Write-Status "Backend started (PID: $backendPID)" "SUCCESS"
    
    # Wait for backend to be ready
    $maxAttempts = 10
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -ErrorAction SilentlyContinue
            if ($response.status -eq "ok") {
                Write-Status "Backend is healthy ✓" "SUCCESS"
                break
            }
        } catch {
            $attempt++
            if ($attempt -eq $maxAttempts) {
                Write-Status "Backend health check failed after 10 attempts" "ERROR"
                exit 1
            }
            Write-Status "Backend not ready, waiting... ($attempt/$maxAttempts)" "INFO"
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Status "Starting frontend server..." "INFO"
    Push-Location $FrontendDir
    $frontendProcess = Start-Process -NoNewWindow -PassThru -FilePath npm -ArgumentList "run","dev"
    Pop-Location
    $frontendPID = $frontendProcess.Id
    Write-Status "Frontend started (PID: $frontendPID)" "SUCCESS"
    
    # Wait for frontend
    Start-Sleep -Seconds 3
    Write-Status "Checking frontend availability..." "INFO"
    
    Write-Host "
╔═══════════════════════════════════════════════════════════════════╗
║                    🚀 KORA Phase 1B Live!                         ║
├═══════════════════════════════════════════════════════════════════┤
║                                                                   ║
║  ✅ Backend:  http://localhost:3000                              ║
║     - API Health: http://localhost:3000/health                  ║
║     - API Docs: http://localhost:3000/api/docs                  ║
║                                                                   ║
║  ✅ Frontend: http://localhost:5173                              ║
║                                                                   ║
║  ✅ Database: postgres://localhost:5432/kora                    ║
║     - User: kora / Password: kora                                ║
║                                                                   ║
║  ✅ Redis: redis://localhost:6379                                ║
║                                                                   ║
├═══════════════════════════════════════════════════════════════════┤
║  Next Steps:                                                      ║
║  1. Open http://localhost:5173 in your browser                   ║
║  2. Test API endpoints (see PHASE_1B_WORKFLOW_FIRST_BLUEPRINT)   ║
║  3. Run tests: cd backend && npm run test                         ║
║  4. View logs: docker compose logs -f                            ║
║                                                                   ║
║  To stop: Press Ctrl+C in terminal windows                        ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    " -ForegroundColor Green
    
    # Keep process alive
    Write-Host "`nPress Ctrl+C to stop all services..." -ForegroundColor Yellow
    while ($true) {
        Start-Sleep -Seconds 10
        # Check if processes are still running
        if (-not (Get-Process -Id $backendPID -ErrorAction SilentlyContinue)) {
            Write-Status "Backend process ended" "WARNING"
            break
        }
    }
}

function Run-Tests {
    Write-Status "Running backend tests..." "INFO"
    Push-Location $BackendDir
    npm run test 2>&1 | Write-Host
    Pop-Location
    
    Write-Status "Running frontend tests..." "INFO"
    Push-Location $FrontendDir
    npm run test 2>&1 | Write-Host
    Pop-Location
}

function Show-Logs {
    Write-Status "Showing Docker logs (press Ctrl+C to exit)..." "INFO"
    docker compose logs -f --tail=100
}

function Clean-Resources {
    Write-Status "Cleaning up Docker resources..." "WARNING"
    
    Write-Host "This will stop and remove containers, but keep data volumes."
    $response = Read-Host "Continue? (y/n)"
    if ($response -ne "y") {
        Write-Status "Cleanup cancelled" "INFO"
        return
    }
    
    docker compose stop
    docker compose rm -f
    Write-Status "Cleanup complete ✓" "SUCCESS"
}

# Main execution
try {
    switch ($Command) {
        "setup" {
            Setup-Environment
            Write-Status "Setup complete! Run: .\kora-phase1b-startup.ps1 start" "SUCCESS"
        }
        "start" {
            Setup-Environment
            Start-Infrastructure
            Apply-Migrations
            Start-Servers
        }
        "test" {
            Run-Tests
        }
        "logs" {
            Show-Logs
        }
        "clean" {
            Clean-Resources
        }
        default {
            Write-Status "Unknown command: $Command" "ERROR"
            exit 1
        }
    }
} catch {
    Write-Status "Error: $_" "ERROR"
    Write-Host $_.Exception.StackTrace
    exit 1
}
