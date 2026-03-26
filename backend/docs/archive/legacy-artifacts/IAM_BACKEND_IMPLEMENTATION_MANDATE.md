# KORA Backend IAM Production Hardening Mandate

## 1. Backend Security Gap Diagnosis
- Raw SQL migrations via tsx src/db/migrate.ts (32 up).
- users table (001_init.sql): id PK, organization_id FK, role TEXT, email UNIQUE—no security fields (password_hash, failed_attempts, locked_until).
- userManagementRepository.ts: Unsalted SHA256 hash, basic CRUD/invite—no policy, history, lockout.
- No login_sessions, password_history, failed_login_attempts tables.
- audit
