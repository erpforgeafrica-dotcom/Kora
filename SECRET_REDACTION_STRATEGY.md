# Secret Redaction in Scripts

**Goal**: Treat seed/deploy scripts as production-grade; redact secrets by default.

**Why**: Admin, clinical, and payment tenants have high blast radius if credentials leak.

---

## Problem Areas

### Current Vulnerabilities

```bash
# scripts/seed.sh (EXPOSES SECRETS!)
#!/bin/bash
set -e

# Hard-coded secrets visible in script
CLERK_SECRET_KEY="sk_test_abc123xyz456"
ANTHROPIC_API_KEY="sk-ant-abc123xyz456"
STRIPE_SECRET_KEY="sk_test_stripe_123"

# Dump to console
echo "Seeding with org: $ORG_ID"
echo "Using Clerk key: $CLERK_SECRET_KEY"
echo "Using Stripe key: $STRIPE_SECRET_KEY"

# Writes to logs
psql -h localhost -U kora -d kora <<EOF
INSERT INTO secrets (key, value) VALUES ('stripe_secret', '$STRIPE_SECRET_KEY');
EOF

# Output visible in CI/CD logs
npm run db:seed >> seed.log
cat seed.log  # LEAKS SECRETS!
```

**Risks**:
- Secrets in git history
- Secrets in CI/CD logs
- Secrets in container images
- Secrets in backups
- Secrets in error messages

---

## Solution: Redaction Framework

### Pattern: Secret Redaction

```typescript
// shared/secretRedaction.ts
const SENSITIVE_KEYS = [
  "api_key",
  "secret_key",
  "password",
  "token",
  "credential",
  "authorization",
  "bearer",
  "private_key",
  "stripe_key",
  "clerk_key",
  "anthropic_key",
  "openai_key",
  "google_key",
  "mistral_key",
];

const SENSITIVE_PATTERNS = [
  /sk_test_[a-z0-9]{32,}/gi,  // Stripe test keys
  /sk_live_[a-z0-9]{32,}/gi,  // Stripe live keys
  /Bearer\s+[a-z0-9\._-]+/gi,  // JWT tokens
  /^sk_[a-z0-9]+$/i,          // Generic secret keys
];

export function redactSecrets(input: string): string {
  let output = input;
  
  // Redact by key names
  for (const key of SENSITIVE_KEYS) {
    const regex = new RegExp(
      `(${key}\\s*[:=]\\s*)([^\\s,}\\]]+)`,
      "gi"
    );
    output = output.replace(regex, `$1***REDACTED***`);
  }
  
  // Redact by patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    output = output.replace(pattern, "***REDACTED***");
  }
  
  return output;
}

export function createSafeLogger() {
  return {
    log: (msg: string) => console.log(redactSecrets(msg)),
    error: (msg: string) => console.error(redactSecrets(msg)),
    info: (msg: string) => console.info(redactSecrets(msg)),
    warn: (msg: string) => console.warn(redactSecrets(msg)),
    debug: (msg: string) => console.debug(redactSecrets(msg)),
  };
}
```

### Updated Scripts

```bash
#!/bin/bash
# scripts/seed.sh (SAFE - secrets redacted)
set -e

# Function to redact output
redact_secrets() {
  sed -E \
    -e 's/sk_test_[a-z0-9]{32,}/***REDACTED***/g' \
    -e 's/sk_live_[a-z0-9]{32,}/***REDACTED***/g' \
    -e 's/(api_key|secret_key|password|token)=([^ ]*)/\1=***REDACTED***/g' \
    -e 's/Bearer [^ ]*/Bearer ***REDACTED***/g'
}

# Export secrets (don't echo them)
export CLERK_SECRET_KEY="${CLERK_SECRET_KEY:-$(echo 'secret from env')}"
export STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-$(echo 'secret from env')}"

# Don't log secrets
echo "Seeding database..."
echo "Environment: ${ENVIRONMENT:-development}"

# Redirect stderr/stdout through redaction filter
npm run db:seed 2>&1 | redact_secrets | tee seed.log

# Verify no secrets in log
if grep -E "sk_test_|sk_live_|Bearer " seed.log; then
  echo "ERROR: Secrets found in output!"
  exit 1
fi

echo "Seed complete. Check seed.log for details (secrets redacted)."
```

### Database Seed Redaction

```typescript
// backend/src/db/seed.ts (safe seed script)
import { redactSecrets, createSafeLogger } from "../shared/secretRedaction.js";

const safeLogger = createSafeLogger();

export async function seedDatabase() {
  safeLogger.info("Starting database seed...");

  // Never log credentials directly
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  safeLogger.info(`Creating admin user...`); // Don't log the password!

  // Create organizations
  const org1 = await createOrganization({
    name: "Demo Clinic",
    slug: "demo-clinic",
  });
  safeLogger.info(`Created organization: ${org1.id}`);

  // Create users
  const admin = await createUser({
    email: "admin@demo-clinic.com",
    role: "business_admin",
    organizationId: org1.id,
    // Don't log password
  });
  safeLogger.info(`Created user: ${admin.email}`);

  // Create API keys (redact in logs)
  const apiKey = generateSecureKey();
  safeLogger.info(
    `Created API key for org ${org1.id}: ${apiKey.substring(0, 8)}...` // Only show prefix
  );

  safeLogger.info("Database seed completed successfully");
}

seedDatabase().catch((err) => {
  safeLogger.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
```

### Docker Build Redaction

```dockerfile
# Dockerfile (safe for CI/CD)
FROM node:20-alpine

WORKDIR /app

# Don't copy .env or secrets
COPY package*.json ./
COPY src ./src
COPY tsconfig.json ./

# Build without accessing secrets
RUN npm ci --only=production
RUN npm run build

# Use secrets from runtime environment, not build
ENV NODE_ENV=production
EXPOSE 3000

# Health check (no secrets exposed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "--enable-source-maps", "dist/server.js"]
```

### CI/CD Pipeline

```yaml
# .github/workflows/seed-and-migrate.yml (GitHub Actions - safe)
name: Database Seed & Migrate

on: [push]

jobs:
  seed:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      # Secrets are injected by GitHub Actions
      # Never logged unless explicitly echoed
      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          # GitHub automatically redacts known secrets in logs

      - name: Seed database
        run: npm run db:seed 2>&1 | scripts/redact-secrets.sh
        env:
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          # Secrets are never exposed in GitHub Actions logs

      # Verify no secrets in artifacts
      - name: Check for leaked secrets
        run: |
          if grep -r "sk_test_\|sk_live_\|Bearer " /tmp/seed.log 2>/dev/null; then
            echo "ERROR: Secrets detected in logs"
            exit 1
          fi

      - name: Upload clean logs
        uses: actions/upload-artifact@v3
        with:
          name: seed-logs
          path: seed.log
```

### Verification & Auditing

```bash
#!/bin/bash
# scripts/verify-no-secrets.sh (Safety check)

set -e

echo "Checking for exposed secrets..."

# Patterns to detect
declare -a PATTERNS=(
  "sk_test_"
  "sk_live_"
  "Bearer "
  "api_key="
  "secret_key="
)

FOUND=0
for pattern in "${PATTERNS[@]}"; do
  if grep -r "$pattern" . --exclude-dir=node_modules --exclude-dir=.git; then
    echo "⚠️  FOUND: $pattern"
    FOUND=1
  fi
done

if [ $FOUND -eq 1 ]; then
  echo "❌ FAIL: Secrets detected in source"
  exit 1
else
  echo "✅ PASS: No secrets detected"
fi
```

---

## Best Practices

1. **Never commit secrets** to git
2. **Use .env.example** as template (with dummy values)
3. **Redact by default** in scripts and logs
4. **Verify redaction** before uploading artifacts
5. **Rotate secrets** regularly
6. **Audit logs** for accidental leaks
7. **Use CI/CD secret management** (GitHub Secrets, etc.)

---

## Files to Update

- [ ] `scripts/seed.sh` - Add redaction filter
- [ ] `scripts/deploy.sh` - Add redaction filter
- [ ] `backend/src/db/seed.ts` - Use safe logger
- [ ] `Dockerfile` - No secrets in build
- [ ] `.github/workflows/*.yml` - Use GitHub Secrets
- [ ] `shared/secretRedaction.ts` (NEW)
- [ ] `scripts/verify-no-secrets.sh` (NEW)

---

## Success Criteria

- [ ] No API keys in git history
- [ ] No secrets in CI/CD logs
- [ ] Seed scripts redact secrets
- [ ] Database dumps don't contain credentials
- [ ] Docker images have no embedded secrets
- [ ] Automated verification passes (verify-no-secrets.sh)
