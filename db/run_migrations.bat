@echo off
REM =====================================================================================
REM KORA MIGRATION RUNNER (Windows)
REM =====================================================================================
REM Runs all 14 migrations in sequence using psql
REM Usage: run_migrations.bat
REM =====================================================================================

setlocal enabledelayedexpansion

echo ======================================================================
echo KORA DATABASE MIGRATION RUNNER
echo ======================================================================
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL environment variable is not set
    echo.
    echo Please set your Supabase connection string:
    echo set DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
    echo.
    pause
    exit /b 1
)

echo [OK] DATABASE_URL is set
echo.

REM List of migrations
set migrations=001_genesis_full_schema.sql 002_rbac_permissions.sql 003_universal_mdm.sql 004_verification_trust.sql 005_hrm_core.sql 006_workflow_approvals.sql 007_finance_erp.sql 008_procurement_inventory.sql 009_crm_erp.sql 010_booking_communications.sql 011_ai_blockchain_security.sql 012_content_media_multilang.sql 013_subscription_ai_management.sql 014_settings_cms_omnichannel.sql

set /a total=14
set /a current=0

echo Starting migration of %total% files...
echo.

REM Run each migration
for %%m in (%migrations%) do (
    set /a current+=1
    echo [!current!/%total%] Running %%m...
    
    if not exist "%%m" (
        echo ERROR: File %%m not found
        pause
        exit /b 1
    )
    
    psql "%DATABASE_URL%" -f "%%m" >nul 2>&1
    if errorlevel 1 (
        echo FAILED: %%m
        echo.
        echo Running again with error output:
        psql "%DATABASE_URL%" -f "%%m"
        pause
        exit /b 1
    )
    
    echo [OK] %%m completed successfully
    echo.
)

echo ======================================================================
echo ALL MIGRATIONS COMPLETED SUCCESSFULLY!
echo ======================================================================
echo.

echo Running verification queries...
echo.

psql "%DATABASE_URL%" -c "SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"

psql "%DATABASE_URL%" -c "SELECT COUNT(*) AS rls_enabled_tables FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;"

psql "%DATABASE_URL%" -c "SELECT COUNT(*) AS total_policies FROM pg_policies WHERE schemaname = 'public';"

echo.
echo ======================================================================
echo MIGRATION COMPLETE
echo ======================================================================
echo.
echo Next steps:
echo 1. Verify table count (should be 133+)
echo 2. Verify RLS policies are active
echo 3. Connect your frontend to Supabase
echo 4. Start building!
echo.
pause
