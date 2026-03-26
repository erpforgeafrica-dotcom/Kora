# KORA CI/CD Pipeline Guide

## Overview

KORA uses **GitHub Actions** for automated testing, building, and deployment across development, staging, and production environments.

**Architecture**:
```
Pull Request → Test Workflow (Lint, TypeScript, Unit Tests)
    ↓ (if tests pass and merge to main)
    ↓ → Build & Push Workflow (Build images, scan for vulnerabilities)
        ↓ (images available in registry)
        ↓ → Manual Staging Deploy (Staging team runs workflow)
            ↓ → Manual Production Deploy (DevOps/Lead approval required)
```

---

## 🔄 Workflows Overview

### 1. Test Workflow (test.yml)

**Trigger**: On every PR and push to `main`/`develop`

**What it does**:
- ✅ Spins up PostgreSQL 16 + Redis 7 containers
- ✅ Installs dependencies (backend + frontend)
- ✅ Runs TypeScript type checking
- ✅ Applies database migrations
- ✅ Runs unit + integration tests (75+ tests)
- ✅ Builds frontend (Vite build)
- ✅ Uploads coverage to Codecov
- ✅ Runs linting (if configured)
- ✅ Posts PR comment on success

**Status Checks** (Required):
- All tests passing
- TypeScript strict mode satisfied
- Build successful

**Duration**: ~5-10 minutes

**Access**: Everyone (automated)

---

### 2. Build & Push Workflow (build-push.yml)

**Trigger**: On push to `main` when code changes

**What it does**:
- ✅ Builds Docker image for backend (multi-stage)
- ✅ Builds Docker image for frontend (multi-stage)
- ✅ Pushes images to GitHub Container Registry (ghcr.io)
- ✅ Tags images with git SHA + branch
- ✅ Uses layer caching for speed
- ✅ Scans images for vulnerabilities (Trivy)
- ✅ Reports security findings

**Image Registry**:
```
ghcr.io/your-org/kora/backend:abc123def
ghcr.io/your-org/kora/frontend:abc123def
ghcr.io/your-org/kora/backend:main  (also tagged)
```

**Security**: Scanning with Trivy
- SARIF reports uploaded to GitHub Security tab
- Fails if critical vulnerabilities found (configurable)

**Duration**: ~10-15 minutes

**Access**: Automatic on merge

---

### 3. Staging Deploy Workflow (deploy-staging.yml)

**Trigger**: Manual via GitHub UI (workflow_dispatch)

**What it does**:
- ✅ SSH into staging server
- ✅ Pulls latest code from `main`
- ✅ Logs into Docker registry
- ✅ Pulls new images
- ✅ Stops old containers (`docker-compose down`)
- ✅ Starts new containers (`docker-compose up -d`)
- ✅ Runs database migrations
- ✅ Verifies health checks (30x retry)
- ✅ Sends Slack notification

**Prerequisites**:
- SSH key configured in GitHub secrets
- Staging server accessible from GitHub runners
- Database URL configured in `.env.staging`

**Health Checks**:
- Backend: `GET https://api-staging.kora.app/health`
- Retries: 30 times with 2s interval (60 seconds total)

**Duration**: ~3-5 minutes

**Access**: Team members with GitHub access

---

### 4. Production Deploy Workflow (deploy-prod.yml)

**Trigger**: Manual via GitHub UI (workflow_dispatch) with approval gate

**What it does**:

**Phase 1 - Pre-Deployment Checks**:
- ✅ Verifies image exists in registry
- ✅ Sends Slack notification (deployment initiated)

**Phase 2 - Approval Gate** (if `require_approval=true`):
- ⏸️ Waits for manual approval in GitHub Environments
- Only approved users can proceed

**Phase 3 - Production Deployment**:
- ✅ Creates RDS database snapshot (backup)
- ✅ SSH into production server
- ✅ Creates backup copy of deployment folder
- ✅ **Blue-Green Deployment**:
  - Updates `backend-prod-2` first
  - Waits for health check
  - Updates `backend-prod` 
  - Updates `frontend-prod`
- ✅ Runs database migrations
- ✅ Performs health checks (backend + frontend)
- ✅ Runs smoke tests (API health, endpoints)
- ✅ Creates GitHub deployment record
- ✅ Sends Slack notification (success/failure)

**Backup Strategy**:
- RDS snapshot created automatically
- Local config backup with timestamp
- Rollback possible within 30 minutes

**Blue-Green Deployment**:
```
Before:  backend-prod-1 (old)  +  backend-prod-2 (old)
Deploy:  Update backend-prod-2 first → health check → update backend-prod-1
After:   backend-prod-1 (new)   +  backend-prod-2 (new)
```

**Duration**: ~5-10 minutes (excluding approval wait)

**Access**: DevOps team + lead approval required

---

## 🔐 GitHub Secrets Setup

### Required Secrets

**For Staging**:
```
STAGING_HOST              = staging.kora.app (SSH hostname)
STAGING_SSH_KEY           = SSH private key for ubuntu user
AWS_ROLE_TO_ASSUME_STAGING = ARN of IAM role (for AWS CLI)
```

**For Production**:
```
PROD_HOST                 = prod.kora.app (SSH hostname)
PROD_SSH_KEY              = SSH private key for ubuntu user
AWS_ROLE_TO_ASSUME_PROD   = ARN of IAM role (for RDS snapshots)
```

**Optional**:
```
SLACK_WEBHOOK            = Slack incoming webhook URL (for notifications)
```

### How to Setup Secrets

1. **Go to Repository Settings** → Secrets and variables → Actions
2. **Click "New repository secret"**
3. **Add each secret** with exact name from above
4. **For SSH Keys**:
   ```bash
   # Generate key if needed
   ssh-keygen -t ed25519 -f deploy_key -C "github-actions"
   
   # Add public key to ~/.ssh/authorized_keys on server
   cat deploy_key.pub | ssh user@server 'cat >> ~/.ssh/authorized_keys'
   
   # Copy private key to GitHub secret
   cat deploy_key
   ```

---

## 🚀 Running Workflows

### Automatic (No Action Needed)
1. **Tests run on every PR** → See status checks at bottom of PR
2. **Images build on merge to main** → Visible in Actions tab

### Manual Deployment

#### Deploy to Staging
1. Go to **Actions** tab in GitHub
2. Select **"Deploy to Staging"** workflow
3. Click **"Run workflow"**
4. Enter:
   - **Image tag**: git SHA from recent build (e.g., `abc123def`) or `latest`
   - **Environment**: staging (or staging-qa for testing)
5. Click **"Run workflow"** button
6. Monitor in Actions tab → wait for ✅ success

#### Deploy to Production
1. Go to **Actions** tab in GitHub
2. Select **"Deploy to Production"** workflow
3. Click **"Run workflow"**
4. Enter:
   - **Image tag**: git SHA or `latest`
   - **Require approval**: true (for safety gate)
5. Click **"Run workflow"** button
6. **Approval step**: Click "Review deployments" → Select environment → approve
7. Monitor in Actions tab → wait for ✅ success

---

## 📊 Monitoring Workflows

### View Workflow Status
```
GitHub → Actions tab → Click workflow name → See runs
```

### View Logs
```
Click on specific run → Click job → View step logs
```

### Common Issues

**Tests Failing**:
- Check test logs in Actions
- Common causes: database not ready, migration failed, environment var missing

**Build Failing**:
- Frontend build error: Check TypeScript errors
- Backend build error: Check available disk space

**Deploy Failing**:
- SSH connection: Check SSH key is correct
- Health check timeout: Backend taking too long to start
- Migration error: Check database migrations
- Slack notification: Verify webhook URL

---

## 🔄 CI/CD Pipeline Flow

### Development Branch Flow (develop)
```
1. Developer pushes code to feature branch
2. Creates PR to develop
3. Tests run automatically ✅
4. Code review + approval
5. Merge to develop
   ↓ (builds but doesn't deploy)
6. Images available in staging registry
```

### Main Branch Flow (main)
```
1. Developer creates PR from develop to main
2. Tests run automatically ✅
3. Code review + approval required
4. Merge to main
   ↓
5. Images build + push ✅
   - Backend: ghcr.io/org/kora/backend:abc123
   - Frontend: ghcr.io/org/kora/frontend:abc123
   ↓
6. Staging team deploys manually
   (via workflow_dispatch)
   ↓
7. QA testing in staging
   ↓
8. (After QA passes)
   DevOps deploys to production
   (via workflow_dispatch + approval)
   ↓
9. Production live ✅
```

---

## 📋 Deployment Checklist

### Before Deployment

**Staging**:
- [ ] Tests passing on main
- [ ] Code reviewed and approved
- [ ] Database migrations tested locally

**Production**:
- [ ] Verified in staging first
- [ ] QA testing complete
- [ ] Database backup created
- [ ] Team notified
- [ ] Rollback plan reviewed
- [ ] Security scan passing

### During Deployment

**Staging**:
- [ ] Monitor Actions logs
- [ ] Verify health checks pass
- [ ] Test key API endpoints
- [ ] Notify QA team

**Production**:
- [ ] Full team aware
- [ ] Approval given
- [ ] Monitor all logs during rollout
- [ ] Verify health checks
- [ ] Run smoke tests
- [ ] Check error rates
- [ ] Monitor application performance

### After Deployment

**Staging**:
- [ ] Run regression tests
- [ ] Verify all services up
- [ ] Check logs for errors

**Production**:
- [ ] Monitor error rates (should be < 1%)
- [ ] Monitor latency (p95 < 500ms)
- [ ] Check database performance
- [ ] Verify backups working
- [ ] Document any issues
- [ ] Do NOT manually make changes
- [ ] Update deployment notes

---

## 🆘 Rollback Procedures

### Quick Rollback (Production)

If deployment fails or causes issues:

```bash
# Option 1: Redeploy previous stable version
1. Go to GitHub Actions
2. Run "Deploy to Production" workflow
3. Use previous git SHA that was stable
4. Approve deployment

# Option 2: Restore from RDS Snapshot (if database affected)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier kora-prod \
  --db-snapshot-identifier kora-prod-pre-deploy-TIMESTAMP

# Option 3: SSH and revert manually (last resort)
ssh ubuntu@prod.kora.app
cd ~/kora.backup.TIMESTAMP
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔍 Troubleshooting

### Workflow Not Triggering

**Tests don't run on PR**:
- Check workflow file syntax (YAML indentation)
- Ensure branch filter matches (main/develop)
- Check file path includes (sometimes tests don't trigger if paths don't match)

**Build doesn't push**:
- Only triggers on `main` branch with code changes
- Check `docker-compose*.yml` or `Dockerfile*` changed

### Deployment Failing

**SSH Connection Issues**:
```
Error: "Permission denied (publickey)"
Fix: SSH key not authorized on server
  1. Generate new key: ssh-keygen -t ed25519
  2. Copy public key to ~/.ssh/authorized_keys on server
  3. Update GitHub secret with private key
```

**Health Check Timeout**:
```
Error: Backend not responding after 60 seconds
Fix: Backend taking too long to start
  1. Check container logs: docker logs kora-backend-prod
  2. Common: Database not ready, OOM, slow startup
  3. Increase timeout in workflow if needed
```

**Migration Failed**:
```
Error: Database migration failed
Fix:
  1. SSH to server: ssh ubuntu@prod.kora.app
  2. Check logs: docker logs kora-backend-prod
  3. Fix migration SQL in backend/src/db/migrations/
  4. Re-deploy
```

### Slack Notifications Not Working

```
Error: Slack notification failed
Fix:
  1. Verify webhook URL: github repo → Settings → Secrets → SLACK_WEBHOOK
  2. Test webhook: curl -X POST -d '{"text":"test"}' WEBHOOK_URL
  3. Update secret if needed
```

---

## 📚 Additional Resources

### GitHub Actions Documentation
- [Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows)
- [Secrets and variables](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Workflow syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

### Docker & Registries
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker build best practices](https://docs.docker.com/develop/dev-best-practices/)

### Blue-Green Deployments
- [Deployment strategies](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#strategy)

---

## ✅ Success Criteria

- ✅ Tests pass on every PR
- ✅ Images build and push on merge to main
- ✅ Staging deploys successfully
- ✅ Production deploys with zero downtime
- ✅ Health checks passing
- ✅ Automated rollback available
- ✅ Team notifications working

---

**Last Updated**: March 15, 2026  
**Status**: Production Ready ✅  
**Version**: 1.0
