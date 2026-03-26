# GitHub Secrets & Environment Setup Guide

## 🔐 Quick Setup Checklist

- [ ] Generate SSH keys (staging + production)
- [ ] Add SSH keys to servers
- [ ] Create GitHub secrets (9 total)
- [ ] Configure AWS IAM roles
- [ ] Setup Slack webhook (optional)
- [ ] Test workflows manually
- [ ] Verify deployments working

---

## 1️⃣ SSH Key Setup

### Generate SSH Keys

**For Staging**:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_staging -C "github-actions-staging"
# Just press Enter (no passphrase for CI/CD)
# Creates: ~/.ssh/github_staging (private) + ~/.ssh/github_staging.pub (public)
```

**For Production**:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_prod -C "github-actions-prod"
# Just press Enter (no passphrase for CI/CD)
# Creates: ~/.ssh/github_prod (private) + ~/.ssh/github_prod.pub (public)
```

### Add Public Keys to Servers

**On Staging Server** (as ubuntu user):
```bash
# Connect to staging server
ssh ubuntu@staging.kora.app

# Add GitHub's staging key
echo "ssh-ed25519 AAAA..." >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify you can login with the key
exit
ssh -i ~/.ssh/github_staging ubuntu@staging.kora.app  # Should work
```

**On Production Server** (as ubuntu user):
```bash
# Connect to prod server
ssh ubuntu@prod.kora.app

# Add GitHub's prod key
echo "ssh-ed25519 AAAA..." >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify you can login with the key
exit
ssh -i ~/.ssh/github_prod ubuntu@prod.kora.app  # Should work
```

---

## 2️⃣ Create GitHub Secrets

**Go to**: Your repo → Settings → Secrets and variables → Actions → New repository secret

### Required Secrets (9 total)

#### General (Shared)
| Secret Name | Value | Example |
|---|---|---|
| `GITHUB_TOKEN` | Automatic (no action needed) | `ghp_xxx` |

#### Staging
| Secret Name | Value | Example |
|---|---|---|
| `STAGING_HOST` | Hostname/IP of staging server | `staging.kora.app` or `192.168.1.100` |
| `STAGING_SSH_KEY` | Contents of `~/.ssh/github_staging` (private key) | `-----BEGIN OPENSSH PRIVATE KEY-----\nAAAA...` |
| `AWS_ROLE_TO_ASSUME_STAGING` | ARN of AWS IAM role for staging | `arn:aws:iam::123456789:role/GitHubActionsStaging` |

#### Production
| Secret Name | Value | Example |
|---|---|---|
| `PROD_HOST` | Hostname/IP of production server | `prod.kora.app` or `1.2.3.4` |
| `PROD_SSH_KEY` | Contents of `~/.ssh/github_prod` (private key) | `-----BEGIN OPENSSH PRIVATE KEY-----\nBBBB...` |
| `AWS_ROLE_TO_ASSUME_PROD` | ARN of AWS IAM role for production | `arn:aws:iam::123456789:role/GitHubActionsProd` |

#### Optional
| Secret Name | Value | Example |
|---|---|---|
| `SLACK_WEBHOOK` | Slack incoming webhook URL | `https://hooks.slack.com/services/XXX/YYY/ZZZ` |

---

## 3️⃣ Add Secrets Step-by-Step

### How to Add Each Secret

1. **Go to**: GitHub repo Settings → Secrets and variables → Actions
2. **Click**: "New repository secret"
3. **Name**: Exact name from table (case sensitive)
4. **Value**: Paste the value
5. **Click**: "Add secret"
6. **Repeat** for each secret

### Example: Adding STAGING_SSH_KEY

```bash
# 1. Get the private key content
cat ~/.ssh/github_staging

# 2. Output:
# -----BEGIN OPENSSH PRIVATE KEY-----
# b3BlbnNzaC1rZXktdjEAAAAABG5vbmUtbm9uZQAAAAg...
# (many lines)
# -----END OPENSSH PRIVATE KEY-----

# 3. Copy ENTIRE output (including BEGIN/END lines)
# 4. Paste into GitHub secret "STAGING_SSH_KEY"
```

---

## 4️⃣ AWS IAM Role Setup

### Create IAM Role for GitHub Actions

**For Staging**:
```bash
# 1. Go to AWS IAM Console
# 2. Create new role: "GitHubActionsStaging"
# 3. Trust policy (who can assume this role):
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"  # Your staging EC2 instance
      },
      "Action": "sts:AssumeRole"
    },
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789:root"  # GitHub's CI/CD runner account
      },
      "Action": "sts:AssumeRole"
    }
  ]
}

# 4. Permissions policy (what this role can do):
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds-db:connect"
      ],
      "Resource": "*"
    }
  ]
}

# 5. Get role ARN: arn:aws:iam::123456789:role/GitHubActionsStaging
# 6. Use ARN as value for GitHub secret AWS_ROLE_TO_ASSUME_STAGING
```

**For Production**:
```bash
# Same steps, but:
# Role name: "GitHubActionsProd"
# Permissions: Include RDS snapshot creation
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:CreateDBSnapshot",
        "rds:DescribeDBSnapshots",
        "rds-db:connect"
      ],
      "Resource": "arn:aws:rds:*:123456789:db/kora-prod*"
    }
  ]
}

# Role ARN: arn:aws:iam::123456789:role/GitHubActionsProd
# Use as value for AWS_ROLE_TO_ASSUME_PROD
```

**AWS CLI Alternative**:
```bash
# Create role via CLI
aws iam create-role \
  --role-name GitHubActionsStaging \
  --assume-role-policy-document file://trust-policy.json

# Add inline policy
aws iam put-role-policy \
  --role-name GitHubActionsStaging \
  --policy-name RdsAccess \
  --policy-document file://policy.json

# Get role ARN
aws iam get-role --role-name GitHubActionsStaging | jq .Role.Arn
```

---

## 5️⃣ Slack Webhook Setup (Optional)

### Get Slack Webhook

1. **Go to**: Slack workspace → Settings → App Directory
2. **Search**: "Incoming Webhooks"
3. **Add**: Create new incoming webhook
4. **Select channel**: #deployments (or your channel)
5. **Copy**: Webhook URL (`https://hooks.slack.com/services/...`)

### Add to GitHub Secrets

1. **Go to**: GitHub repo Settings → Secrets
2. **New secret** → Name: `SLACK_WEBHOOK`
3. **Value**: Paste webhook URL
4. **Save**

### Test Slack Notification

```bash
# Test the webhook directly
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test notification from GitHub Actions"}' \
  https://hooks.slack.com/services/XXX/YYY/ZZZ
```

---

## 6️⃣ Environment Configuration Setup

### Staging Environment

1. **Go to**: GitHub repo Settings → Environments
2. **New environment**: `staging`
3. **URL**: `https://api-staging.kora.app`
4. **Deployment branches**: `main` (allow deployments)
5. **Reviewers**: (none required - automatic)

### Production Environment

1. **Go to**: GitHub repo Settings → Environments
2. **New environment**: `production`
3. **URL**: `https://api.kora.app`
4. **Deployment branches**: `main` only
5. **Reviewers**: (select 1+ team members for approval gate)
6. **Prevent forked workflows**: Enabled

---

## 7️⃣ Pre-Deployment Verification

### Test SSH Connection

```bash
# Test staging
ssh -i ~/.ssh/github_staging ubuntu@staging.kora.app "echo 'Connection successful'"

# Test production
ssh -i ~/.ssh/github_prod ubuntu@prod.kora.app "echo 'Connection successful'"
```

### Test Docker Registry Access

```bash
# Login to GitHub Container Registry (from any machine)
echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin

# Test pushing small image
docker tag ubuntu:latest ghcr.io/your-org/test:latest
docker push ghcr.io/your-org/test:latest
```

### Test Database Connectivity

**On Staging Server**:
```bash
# SSH to server
ssh ubuntu@staging.kora.app

# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"

# Test Redis connection
redis-cli -u $REDIS_URL ping
```

**Test AWS RDS Access**:
```bash
# From production server
aws rds describe-db-instances --db-instance-identifier kora-prod
```

---

## 8️⃣ Running Your First Workflows

### Test Run Tests Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/test-ci
   ```

2. **Make a small change**:
   ```bash
   echo "# Test" > TEST.md
   git add TEST.md
   git commit -m "Test CI/CD workflow"
   ```

3. **Push and create PR**:
   ```bash
   git push origin feature/test-ci
   # Go to GitHub and create PR to main
   ```

4. **Watch tests run**:
   - GitHub → Pull requests → Your PR
   - Scroll down to see test status
   - Click "Actions" tab to view logs

### Test Build & Push Workflow

1. **Merge PR to main**:
   ```bash
   # Approve PR and merge
   ```

2. **Watch build run**:
   - GitHub → Actions → "Build and push Docker images"
   - Should see images built and pushed to registry

3. **Verify images in registry**:
   ```bash
   # List images
   curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
     https://api.github.com/user/packages/container/kora%2Fbackend/versions
   ```

### Test Staging Deployment

1. **Go to**: GitHub → Actions
2. **Select**: "Deploy to Staging"
3. **Click**: "Run workflow"
4. **Enter**: Image tag from build (SHA or `latest`)
5. **Click**: "Run workflow"
6. **Monitor**: Watch logs for:
   - SSH connection ✅
   - Docker images pulled ✅
   - Services started ✅
   - Health checks passing ✅
   - Slack notification ✅

### Test Production Deployment (Dry Run)

1. **Go to**: GitHub → Actions
2. **Select**: "Deploy to Production"
3. **Enter**: Image tag (use stable version)
4. **Set**: `require_approval` = false (skip approval for testing)
5. **Run**: Click "Run workflow"
6. **Verify**:
   - Blue-green deployment ✅
   - RDS backup created ✅
   - Health checks passing ✅
   - Slack notifications ✅

---

## 🆘 Troubleshooting Setup

### SSH Key Issues

**Error**: `Permission denied (publickey)`

**Fix**:
```bash
# 1. Verify key on server
ssh ubuntu@staging.kora.app "cat ~/.ssh/authorized_keys | grep github"

# 2. If not there, add it:
cat ~/.ssh/github_staging.pub | ssh ubuntu@staging.kora.app 'cat >> ~/.ssh/authorized_keys'

# 3. Verify permissions
ssh ubuntu@staging.kora.app "ls -la ~/.ssh/authorized_keys"  
# Should be: -rw------- (600)
```

### AWS Role Issues

**Error**: `NotAuthorizedException` when assuming role

**Fix**:
```bash
# 1. Verify role ARN is correct
aws iam get-role --role-name GitHubActionsStaging | jq .Role.Arn

# 2. Check trust relationship
aws iam get-role --role-name GitHubActionsStaging | jq .Role.AssumeRolePolicyDocument

# 3. Verify GitHub's service account is in trust policy
# Should include: arn:aws:iam::123456789:root or specific GitHub OIDC provider
```

### Secret Not Reading

**Error**: `STAGING_SSH_KEY: not found`

**Fix**:
```bash
# 1. Verify secret name (case sensitive)
# GitHub Settings → Secrets → Check exact spelling

# 2. Verify secret isn't empty
# Go to secret and click "Update"
# Should show *** (dots) if value present

# 3. Redeploy if recently added
# Secrets take ~30 seconds to propagate
```

### Slack Webhook Not Working

**Error**: `Slack notification failed`

**Fix**:
```bash
# 1. Verify webhook URL
echo $SLACK_WEBHOOK  # Should show full URL

# 2. Test webhook manually
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  $SLACK_WEBHOOK

# 3. Check Slack channel settings
# May be set to not allow external webhooks
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] SSH keys generated and authorized on both servers
- [ ] All 9 GitHub secrets added and verified
- [ ] AWS IAM roles created with correct trust relationships
- [ ] Slack webhook configured (optional)
- [ ] Test workflow passed on PR
- [ ] Build workflow pushed images to registry
- [ ] Staging deployment successful
- [ ] Production deployment tested
- [ ] All health checks passing
- [ ] Slack notifications working

---

## 📞 Support

**GitHub Actions Logs**:
- GitHub → Actions → Click workflow → Click run → View logs

**SSH Debugging**:
```bash
ssh -vvv -i ~/.ssh/github_staging ubuntu@staging.kora.app
```

**Docker Registry Issues**:
```bash
# Check image push
docker push ghcr.io/your-org/kora/backend:test

# Check image pull
docker pull ghcr.io/your-org/kora/backend:test
```

**Database Issues**:
```bash
# From server
docker logs kora-backend-staging
docker exec kora-backend-staging npm run db:migrate
```

---

**Last Updated**: March 15, 2026  
**Status**: Production Ready ✅
