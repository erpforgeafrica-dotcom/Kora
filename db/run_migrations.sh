#!/bin/bash

# =====================================================================================
# KORA MIGRATION RUNNER
# =====================================================================================
# Runs all 14 migrations in sequence using psql
# Usage: ./run_migrations.sh
# =====================================================================================

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "======================================================================"
echo "KORA DATABASE MIGRATION RUNNER"
echo "======================================================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Please set your Supabase connection string:"
    echo "export DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres\""
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ DATABASE_URL is set${NC}"
echo ""

# Array of migration files in order
migrations=(
    "001_genesis_full_schema.sql"
    "002_rbac_permissions.sql"
    "003_universal_mdm.sql"
    "004_verification_trust.sql"
    "005_hrm_core.sql"
    "006_workflow_approvals.sql"
    "007_finance_erp.sql"
    "008_procurement_inventory.sql"
    "009_crm_erp.sql"
    "010_booking_communications.sql"
    "011_ai_blockchain_security.sql"
    "012_content_media_multilang.sql"
    "013_subscription_ai_management.sql"
    "014_settings_cms_omnichannel.sql"
)

# Counter
total=${#migrations[@]}
current=0

echo "Starting migration of ${total} files..."
echo ""

# Run each migration
for migration in "${migrations[@]}"; do
    current=$((current + 1))
    echo -e "${YELLOW}[${current}/${total}] Running ${migration}...${NC}"
    
    if [ ! -f "$migration" ]; then
        echo -e "${RED}ERROR: File ${migration} not found${NC}"
        exit 1
    fi
    
    if psql "$DATABASE_URL" -f "$migration" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ${migration} completed successfully${NC}"
    else
        echo -e "${RED}✗ ${migration} failed${NC}"
        echo ""
        echo "Running again with error output:"
        psql "$DATABASE_URL" -f "$migration"
        exit 1
    fi
    
    echo ""
done

echo "======================================================================"
echo -e "${GREEN}ALL MIGRATIONS COMPLETED SUCCESSFULLY!${NC}"
echo "======================================================================"
echo ""

# Run verification queries
echo "Running verification queries..."
echo ""

psql "$DATABASE_URL" << EOF
-- Count tables
SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- Check RLS enabled tables
SELECT COUNT(*) AS rls_enabled_tables
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- Check RLS policies
SELECT COUNT(*) AS total_policies
FROM pg_policies
WHERE schemaname = 'public';
EOF

echo ""
echo "======================================================================"
echo -e "${GREEN}✓ MIGRATION COMPLETE${NC}"
echo "======================================================================"
echo ""
echo "Next steps:"
echo "1. Verify table count (should be 133+)"
echo "2. Verify RLS policies are active"
echo "3. Connect your frontend to Supabase"
echo "4. Start building!"
echo ""
