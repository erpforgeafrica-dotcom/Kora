\echo 'KORA canonical schema loader'
\echo 'Generated from the ordered migration chain because a live pg_dump could not run without PostgreSQL.'

\i backend/src/db/migrations/001_init.sql
\i backend/src/db/migrations/002_ai_foundation.sql
\i backend/src/db/migrations/003_orchestration_feedback.sql
\i backend/src/db/migrations/004_schema_completion.sql
\i backend/src/db/migrations/005_payments.sql
\i backend/src/db/migrations/006_audience_schema.sql
\i backend/src/db/migrations/006b_seed_categories.sql
\i backend/src/db/migrations/007_booking_engine.sql
\i backend/src/db/migrations/008_service_registry.sql
\i backend/src/db/migrations/009_payments_real.sql
\i backend/src/db/migrations/010_communications.sql
\i backend/src/db/migrations/011_advanced_integrations.sql
\i backend/src/db/migrations/011_tenant_crm_alignment.sql
\i backend/src/db/migrations/012_phase8_automation_tracking.sql
\i backend/src/db/migrations/012_service_management.sql
\i backend/src/db/migrations/013_user_management.sql
