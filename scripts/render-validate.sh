#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# KORA Render Pre-Deployment Validation Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -euo pipefail

ENVIRONMENT="${1:-development}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COLORS_ENABLED=true

# ──────────────────────────────────────────────────────────────────────────────
# Color output utilities
# ──────────────────────────────────────────────────────────────────────────────

color_green() {
  if [[ "$COLORS_ENABLED" == true ]]; then
    echo -e "\033[32m$*\033[0m"
  else
    echo "$*"
  fi
}

color_yellow() {
  if [[ "$COLORS_ENABLED" == true ]]; then
    echo -e "\033[33m$*\033[0m"
  else
    echo "$*"
  fi
}

color_red() {
  if [[ "$COLORS_ENABLED" == true ]]; then
    echo -e "\033[31m$*\033[0m"
  else
    echo "$*"
  fi
}

color_blue() {
  if [[ "$COLORS_ENABLED" == true ]]; then
    echo -e "\033[34m$*\033[0m"
  else
    echo "$*"
  fi
}

# ──────────────────────────────────────────────────────────────────────────────
# Logging utilities
# ──────────────────────────────────────────────────────────────────────────────

log_section() {
  echo ""
  color_blue "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "$1"
  color_blue "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

log_check() {
  echo -n "🔍 $1 ... "
}

log_pass() {
  color_green "✓ $1"
}

log_fail() {
  color_red "✗ $1"
}

log_warning() {
  color_yellow "⚠️  $1"
}

log_info() {
  echo "ℹ️  $1"
}

# ──────────────────────────────────────────────────────────────────────────────
# Validation functions
# ──────────────────────────────────────────────────────────────────────────────

check_command_exists() {
  if command -v "$1" &> /dev/null; then
    return 0
  else
    return 1
  fi
}

validate_backend_build() {
  log_section "Backend Build Validation"
  
  cd "$PROJECT_ROOT/backend"
  
  log_check "TypeScript compilation"
  if npm run build &> /dev/null; then
    log_pass "TypeScript compilation"
  else
    log_fail "TypeScript compilation failed"
    npm run build 2>&1 | head -20
    return 1
  fi
  
  log_check "Type checking"
  if npm run typecheck &> /dev/null; then
    log_pass "Type checking"
  else
    log_fail "Type checking failed"
    npm run typecheck 2>&1 | head -20
    return 1
  fi
}

validate_frontend_build() {
  log_section "Frontend Build Validation"
  
  cd "$PROJECT_ROOT/frontend"
  
  log_check "Vite build"
  if npm run build &> /dev/null; then
    log_pass "Vite build"
  else
    log_fail "Vite build failed"
    npm run build 2>&1 | head -20
    return 1
  fi
  
  log_check "Built files exist"
  if [[ -d "dist" && $(ls -1 dist | wc -l) -gt 0 ]]; then
    log_pass "Built files exist"
    log_info "  Files: $(ls -1 dist | wc -l) items"
  else
    log_fail "dist directory is empty"
    return 1
  fi
}

validate_env_vars() {
  log_section "Environment Variables Validation"
  
  local render_yaml="$PROJECT_ROOT/render.yaml"
  
  log_check "render.yaml exists"
  if [[ -f "$render_yaml" ]]; then
    log_pass "render.yaml exists"
  else
    log_fail "render.yaml not found"
    return 1
  fi
  
  log_check "No hardcoded secrets in render.yaml"
  if grep -q "sk_test_\|sk_live_\|sk-\|Bearer " "$render_yaml"; then
    log_fail "Hardcoded secrets detected in render.yaml"
    log_warning "  Found potential secret values - these must be removed!"
    grep -n "sk_test_\|sk_live_\|sk-\|Bearer " "$render_yaml" || true
    return 1
  else
    log_pass "No hardcoded secrets found"
  fi
  
  log_check "Backend .env.example exists"
  if [[ -f "$PROJECT_ROOT/backend/.env.example" ]]; then
    log_pass "Backend .env.example exists"
  else
    log_warning "Backend .env.example not found"
  fi
}

validate_docker() {
  log_section "Docker Configuration Validation"
  
  if ! check_command_exists docker; then
    log_warning "Docker not installed - skipping Docker validation"
    return 0
  fi
  
  log_check "Dockerfile exists"
  if [[ -f "$PROJECT_ROOT/Dockerfile" ]]; then
    log_pass "Dockerfile exists"
  else
    log_fail "Dockerfile not found"
    return 1
  fi
  
  log_check "Docker build (dry-run)"
  if docker build --dry-run "$PROJECT_ROOT" &> /dev/null; then
    log_pass "Docker build configuration valid"
  else
    log_warning "Docker build validation failed (may be OK if Docker daemon not running)"
  fi
}

validate_package_json() {
  log_section "Package Configuration Validation"
  
  log_check "Backend package.json"
  if [[ -f "$PROJECT_ROOT/backend/package.json" ]]; then
    # Check for required scripts
    if grep -q '"build"' "$PROJECT_ROOT/backend/package.json" && \
       grep -q '"start"' "$PROJECT_ROOT/backend/package.json"; then
      log_pass "Backend package.json has required scripts"
    else
      log_fail "Backend package.json missing required scripts"
      return 1
    fi
  else
    log_fail "Backend package.json not found"
    return 1
  fi
  
  log_check "Frontend package.json"
  if [[ -f "$PROJECT_ROOT/frontend/package.json" ]]; then
    if grep -q '"build"' "$PROJECT_ROOT/frontend/package.json"; then
      log_pass "Frontend package.json has required scripts"
    else
      log_fail "Frontend package.json missing build script"
      return 1
    fi
  else
    log_fail "Frontend package.json not found"
    return 1
  fi
}

validate_migrations() {
  log_section "Database Migration Validation"
  
  cd "$PROJECT_ROOT/backend"
  
  log_check "Migrations directory exists"
  if [[ -d "src/db/migrations" ]]; then
    local migration_count=$(ls -1 src/db/migrations/*.sql 2>/dev/null | wc -l)
    if [[ $migration_count -gt 0 ]]; then
      log_pass "Migrations found ($migration_count files)"
    else
      log_fail "No migration files found"
      return 1
    fi
  else
    log_fail "Migrations directory not found"
    return 1
  fi
}

validate_staging_yaml() {
  log_section "Staging Configuration Validation"
  
  local staging_yaml="$PROJECT_ROOT/render.staging.yaml"
  
  log_check "render.staging.yaml exists"
  if [[ -f "$staging_yaml" ]]; then
    log_pass "render.staging.yaml exists"
  else
    log_warning "render.staging.yaml not found - creating would be recommended"
  fi
  
  log_check "No hardcoded secrets in render.staging.yaml"
  if [[ -f "$staging_yaml" ]]; then
    if grep -q "sk_test_\|sk_live_\|sk-\|Bearer " "$staging_yaml"; then
      log_fail "Hardcoded secrets detected in render.staging.yaml"
      return 1
    else
      log_pass "No hardcoded secrets found"
    fi
  fi
}

generate_summary() {
  log_section "Validation Summary"
  
  local total_checks=$1
  local failed_checks=$2
  local passed_checks=$((total_checks - failed_checks))
  
  echo ""
  echo "Total Checks: $total_checks"
  color_green "Passed: $passed_checks"
  if [[ $failed_checks -gt 0 ]]; then
    color_red "Failed: $failed_checks"
    echo ""
    color_red "❌ Validation FAILED"
    return 1
  else
    echo ""
    color_green "✅ Validation PASSED"
    return 0
  fi
}

# ──────────────────────────────────────────────────────────────────────────────
# Main execution
# ──────────────────────────────────────────────────────────────────────────────

main() {
  color_blue "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  color_blue "  KORA Render Pre-Deployment Validation"
  color_blue "  Environment: $ENVIRONMENT"
  color_blue "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  local failed_checks=0
  
  # Run validations
  validate_package_json || ((failed_checks++))
  validate_backend_build || ((failed_checks++))
  validate_frontend_build || ((failed_checks++))
  validate_env_vars || ((failed_checks++))
  validate_docker || ((failed_checks++))
  validate_migrations || ((failed_checks++))
  validate_staging_yaml || ((failed_checks++))
  
  # Generate summary
  local total_checks=7
  generate_summary "$total_checks" "$failed_checks" || exit 1
  
  # Next steps
  log_section "Next Steps"
  echo ""
  echo "1. Fix any validation errors above"
  echo "2. Commit changes:"
  echo "   git add ."
  echo "   git commit -m 'fix: pre-deployment validation'"
  echo "   git push origin main"
  echo ""
  echo "3. Deploy to Render:"
  echo "   - Set environment variables in Render dashboard"
  echo "   - Render will auto-deploy from render.yaml"
  echo ""
  echo "4. Monitor deployment:"
  echo "   render logs --service kora-backend --follow"
  echo ""
  
  exit 0
}

main "$@"
