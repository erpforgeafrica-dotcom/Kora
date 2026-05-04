# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# KORA Render Pre-Deployment Validation Script (PowerShell)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

param(
    [string]$Environment = "development"
)

$ErrorActionPreference = "Stop"

# ──────────────────────────────────────────────────────────────────────────────
# Setup
# ──────────────────────────────────────────────────────────────────────────────

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ScriptDir = $PSScriptRoot
$FailedChecks = 0
$TotalChecks = 0

# ──────────────────────────────────────────────────────────────────────────────
# Color output utilities
# ──────────────────────────────────────────────────────────────────────────────

function Write-Green {
    Write-Host $args[0] -ForegroundColor Green
}

function Write-Yellow {
    Write-Host $args[0] -ForegroundColor Yellow
}

function Write-Red {
    Write-Host $args[0] -ForegroundColor Red
}

function Write-Blue {
    Write-Host $args[0] -ForegroundColor Cyan
}

# ──────────────────────────────────────────────────────────────────────────────
# Logging utilities
# ──────────────────────────────────────────────────────────────────────────────

function Write-Section {
    Write-Host ""
    Write-Blue "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host $args[0]
    Write-Blue "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

function Write-Check {
    Write-Host "🔍 $($args[0]) ... " -NoNewline
}

function Write-Pass {
    Write-Green "✓ $($args[0])"
}

function Write-Fail {
    Write-Red "✗ $($args[0])"
}

function Write-Warning {
    Write-Yellow "⚠️  $($args[0])"
}

function Write-Info {
    Write-Host "ℹ️  $($args[0])"
}

# ──────────────────────────────────────────────────────────────────────────────
# Validation functions
# ──────────────────────────────────────────────────────────────────────────────

function Test-BackendBuild {
    Write-Section "Backend Build Validation"
    
    Push-Location "$ProjectRoot\backend"
    
    Write-Check "TypeScript compilation"
    try {
        npm run build 2>&1 | Out-Null
        Write-Pass "TypeScript compilation"
    } catch {
        Write-Fail "TypeScript compilation failed"
        npm run build 2>&1 | Select-Object -First 20
        $script:FailedChecks++
        Pop-Location
        return $false
    }
    
    Write-Check "Type checking"
    try {
        npm run typecheck 2>&1 | Out-Null
        Write-Pass "Type checking"
    } catch {
        Write-Fail "Type checking failed"
        npm run typecheck 2>&1 | Select-Object -First 20
        $script:FailedChecks++
        Pop-Location
        return $false
    }
    
    Pop-Location
    return $true
}

function Test-FrontendBuild {
    Write-Section "Frontend Build Validation"
    
    Push-Location "$ProjectRoot\frontend"
    
    Write-Check "Vite build"
    try {
        npm run build 2>&1 | Out-Null
        Write-Pass "Vite build"
    } catch {
        Write-Fail "Vite build failed"
        npm run build 2>&1 | Select-Object -First 20
        $script:FailedChecks++
        Pop-Location
        return $false
    }
    
    Write-Check "Built files exist"
    $distPath = "$ProjectRoot\frontend\dist"
    if ((Test-Path $distPath) -and ((Get-ChildItem $distPath | Measure-Object).Count -gt 0)) {
        $fileCount = (Get-ChildItem $distPath | Measure-Object).Count
        Write-Pass "Built files exist"
        Write-Info "  Files: $fileCount items"
    } else {
        Write-Fail "dist directory is empty"
        $script:FailedChecks++
        Pop-Location
        return $false
    }
    
    Pop-Location
    return $true
}

function Test-EnvVars {
    Write-Section "Environment Variables Validation"
    
    $renderYaml = "$ProjectRoot\render.yaml"
    
    Write-Check "render.yaml exists"
    if (Test-Path $renderYaml) {
        Write-Pass "render.yaml exists"
    } else {
        Write-Fail "render.yaml not found"
        $script:FailedChecks++
        return $false
    }
    
    Write-Check "No hardcoded secrets in render.yaml"
    $content = Get-Content $renderYaml -Raw
    $secretPatterns = @('sk_test_', 'sk_live_', 'sk-', 'Bearer ')
    $hasSecrets = $false
    
    foreach ($pattern in $secretPatterns) {
        if ($content -match $pattern) {
            $hasSecrets = $true
            break
        }
    }
    
    if ($hasSecrets) {
        Write-Fail "Hardcoded secrets detected in render.yaml"
        Write-Warning "  Found potential secret values - these must be removed!"
        $script:FailedChecks++
        return $false
    } else {
        Write-Pass "No hardcoded secrets found"
    }
    
    Write-Check "Backend .env.example exists"
    if (Test-Path "$ProjectRoot\backend\.env.example") {
        Write-Pass "Backend .env.example exists"
    } else {
        Write-Warning "Backend .env.example not found"
    }
    
    return $true
}

function Test-PackageJson {
    Write-Section "Package Configuration Validation"
    
    Write-Check "Backend package.json"
    $backendPkg = "$ProjectRoot\backend\package.json"
    if (Test-Path $backendPkg) {
        $content = Get-Content $backendPkg -Raw
        if ($content -match '"build"' -and $content -match '"start"') {
            Write-Pass "Backend package.json has required scripts"
        } else {
            Write-Fail "Backend package.json missing required scripts"
            $script:FailedChecks++
            return $false
        }
    } else {
        Write-Fail "Backend package.json not found"
        $script:FailedChecks++
        return $false
    }
    
    Write-Check "Frontend package.json"
    $frontendPkg = "$ProjectRoot\frontend\package.json"
    if (Test-Path $frontendPkg) {
        $content = Get-Content $frontendPkg -Raw
        if ($content -match '"build"') {
            Write-Pass "Frontend package.json has required scripts"
        } else {
            Write-Fail "Frontend package.json missing build script"
            $script:FailedChecks++
            return $false
        }
    } else {
        Write-Fail "Frontend package.json not found"
        $script:FailedChecks++
        return $false
    }
    
    return $true
}

function Test-Migrations {
    Write-Section "Database Migration Validation"
    
    $migrationsDir = "$ProjectRoot\backend\src\db\migrations"
    
    Write-Check "Migrations directory exists"
    if (Test-Path $migrationsDir) {
        $migrations = Get-ChildItem "$migrationsDir\*.sql" -ErrorAction SilentlyContinue
        if ($migrations.Count -gt 0) {
            Write-Pass "Migrations found ($($migrations.Count) files)"
        } else {
            Write-Fail "No migration files found"
            $script:FailedChecks++
            return $false
        }
    } else {
        Write-Fail "Migrations directory not found"
        $script:FailedChecks++
        return $false
    }
    
    return $true
}

function Test-StagingYaml {
    Write-Section "Staging Configuration Validation"
    
    $stagingYaml = "$ProjectRoot\render.staging.yaml"
    
    Write-Check "render.staging.yaml exists"
    if (Test-Path $stagingYaml) {
        Write-Pass "render.staging.yaml exists"
    } else {
        Write-Warning "render.staging.yaml not found - creating would be recommended"
    }
    
    Write-Check "No hardcoded secrets in render.staging.yaml"
    if (Test-Path $stagingYaml) {
        $content = Get-Content $stagingYaml -Raw
        $secretPatterns = @('sk_test_', 'sk_live_', 'sk-', 'Bearer ')
        $hasSecrets = $false
        
        foreach ($pattern in $secretPatterns) {
            if ($content -match $pattern) {
                $hasSecrets = $true
                break
            }
        }
        
        if ($hasSecrets) {
            Write-Fail "Hardcoded secrets detected in render.staging.yaml"
            $script:FailedChecks++
            return $false
        } else {
            Write-Pass "No hardcoded secrets found"
        }
    }
    
    return $true
}

function Write-Summary {
    Write-Section "Validation Summary"
    
    $total = 6
    $passed = $total - $FailedChecks
    
    Write-Host ""
    Write-Host "Total Checks: $total"
    Write-Green "Passed: $passed"
    if ($FailedChecks -gt 0) {
        Write-Red "Failed: $FailedChecks"
        Write-Host ""
        Write-Red "❌ Validation FAILED"
        return $false
    } else {
        Write-Host ""
        Write-Green "✅ Validation PASSED"
        return $true
    }
}

function Write-NextSteps {
    Write-Section "Next Steps"
    
    Write-Host ""
    Write-Host "1. Fix any validation errors above"
    Write-Host "2. Commit changes:"
    Write-Host "   git add ."
    Write-Host "   git commit -m 'fix: pre-deployment validation'"
    Write-Host "   git push origin main"
    Write-Host ""
    Write-Host "3. Deploy to Render:"
    Write-Host "   - Set environment variables in Render dashboard"
    Write-Host "   - Render will auto-deploy from render.yaml"
    Write-Host ""
    Write-Host "4. Monitor deployment:"
    Write-Host "   render logs --service kora-backend --follow"
    Write-Host ""
}

# ──────────────────────────────────────────────────────────────────────────────
# Main execution
# ──────────────────────────────────────────────────────────────────────────────

Write-Blue "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Blue "  KORA Render Pre-Deployment Validation"
Write-Blue "  Environment: $Environment"
Write-Blue "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run validations
Test-PackageJson
Test-BackendBuild
Test-FrontendBuild
Test-EnvVars
Test-Migrations
Test-StagingYaml

# Generate summary and next steps
$success = Write-Summary
Write-NextSteps

if (-not $success) {
    exit 1
}

exit 0
