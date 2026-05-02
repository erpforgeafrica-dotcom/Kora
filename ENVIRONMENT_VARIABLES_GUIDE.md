# 🔧 KORA Threat Detection - Environment Variables Setup

## 🎯 Required Environment Variables

### **Core Database & Redis**
```bash
# Database (already configured)
DATABASE_URL=postgresql://postgres.zihocnhvtgodnawnvoyj:KoraDB2024secure@aws-0-eu-west-1.pooler.supabase.com:6543/postgres

# Redis for event streaming
REDIS_URL=redis://localhost:6379
```

### **Threat Detection Configuration**
```bash
# Threat Detection Settings
ANOMALY_SCAN_INTERVAL_MS=60000
SIGNAL_AGG_INTERVAL_MS=45000
THREAT_DETECTION_ENABLED=true
AUTO_RESPONSE_ENABLED=true

# Security Thresholds (0-100)
SQL_INJECTION_THRESHOLD=85
CROSS_ORG_THRESHOLD=90
BRUTE_FORCE_THRESHOLD=70
IMPOSSIBLE_TRAVEL_THRESHOLD=75
DATA_EXFIL_THRESHOLD=75
PRIVILEGE_ESC_THRESHOLD=80
TOKEN_ANOMALY_THRESHOLD=65
RATE_LIMIT_THRESHOLD=70

# Auto-Response Configuration
AUTO_REVOKE_SESSION_THRESHOLD=85
AUTO_BLOCK_IP_THRESHOLD=80
AUTO_LOCK_ACCOUNT_THRESHOLD=95

# IP Blocking Duration (milliseconds)
IP_BLOCK_DURATION_MS=86400000

# Security Team Notifications
SECURITY_ALERT_WEBHOOK_URL=
SECURITY_TEAM_EMAIL=security@yourcompany.com
SLACK_SECURITY_WEBHOOK=
```

### **Monitoring & Logging**
```bash
# Enhanced Security Logging
SECURITY_LOG_LEVEL=info
THREAT_LOG_RETENTION_DAYS=90
AUDIT_LOG_ENABLED=true

# Metrics & Monitoring
PROMETHEUS_ENABLED=false
GRAFANA_WEBHOOK_URL=
SENTRY_SECURITY_DSN=

# Performance Monitoring
SLOW_QUERY_THRESHOLD_MS=1000
THREAT_PROCESSING_TIMEOUT_MS=5000
```

### **Feature Flags**
```bash
# Threat Detection Features
ENABLE_SQL_INJECTION_DETECTION=true
ENABLE_CROSS_ORG_DETECTION=true
ENABLE_BRUTE_FORCE_DETECTION=true
ENABLE_IMPOSSIBLE_TRAVEL=true
ENABLE_DATA_EXFILTRATION_DETECTION=true
ENABLE_PRIVILEGE_ESCALATION_DETECTION=true
ENABLE_TOKEN_ANOMALY_DETECTION=true
ENABLE_RATE_LIMIT_DETECTION=true

# Dashboard Features
ENABLE_SECURITY_DASHBOARD=true
ENABLE_REAL_TIME_ALERTS=true
ENABLE_INCIDENT_MANAGEMENT=true
```

## 🚀 Quick Setup Commands

### **For Development:**
```bash
# Add to your .env file
echo "THREAT_DETECTION_ENABLED=true" >> backend/.env
echo "AUTO_RESPONSE_ENABLED=true" >> backend/.env
echo "ANOMALY_SCAN_INTERVAL_MS=60000" >> backend/.env
echo "SIGNAL_AGG_INTERVAL_MS=45000" >> backend/.env
echo "SECURITY_LOG_LEVEL=info" >> backend/.env
```

### **For Production:**
```bash
# Set in your deployment platform
THREAT_DETECTION_ENABLED=true
AUTO_RESPONSE_ENABLED=true
SECURITY_LOG_LEVEL=warn
THREAT_LOG_RETENTION_DAYS=365
```

## 🔐 Security-Specific Variables

### **Critical Thresholds (Recommended Values):**
```bash
# High-confidence detectors (auto-response enabled)
SQL_INJECTION_THRESHOLD=85
CROSS_ORG_THRESHOLD=90
BRUTE_FORCE_THRESHOLD=70
PRIVILEGE_ESC_THRESHOLD=80

# Medium-confidence detectors (manual review)
IMPOSSIBLE_TRAVEL_THRESHOLD=75
DATA_EXFIL_THRESHOLD=75
TOKEN_ANOMALY_THRESHOLD=65
RATE_LIMIT_THRESHOLD=70
```

### **Auto-Response Settings:**
```bash
# Session Management
AUTO_REVOKE_SESSION_THRESHOLD=85
SESSION_TIMEOUT_AFTER_THREAT_MS=300000

# IP Blocking
AUTO_BLOCK_IP_THRESHOLD=80
IP_BLOCK_DURATION_MS=86400000
MAX_FAILED_ATTEMPTS_PER_IP=10

# Account Security
AUTO_LOCK_ACCOUNT_THRESHOLD=95
ACCOUNT_LOCK_DURATION_MS=3600000
```

## 📊 Monitoring Variables

### **Performance Monitoring:**
```bash
# Processing Limits
THREAT_PROCESSING_TIMEOUT_MS=5000
MAX_EVENTS_PER_BATCH=100
EVENT_QUEUE_MAX_SIZE=10000

# Database Performance
SLOW_QUERY_THRESHOLD_MS=1000
DB_CONNECTION_POOL_SIZE=20
THREAT_DB_TIMEOUT_MS=30000
```

### **Alerting Configuration:**
```bash
# Notification Channels
SECURITY_TEAM_EMAIL=security@yourcompany.com
SLACK_SECURITY_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
PAGERDUTY_INTEGRATION_KEY=

# Alert Thresholds
CRITICAL_ALERT_THRESHOLD=90
HIGH_ALERT_THRESHOLD=75
ALERT_COOLDOWN_MS=300000
```

## 🎯 Platform-Specific Setup

### **Render.com:**
```bash
# Add these in Render Dashboard > Environment
THREAT_DETECTION_ENABLED=true
AUTO_RESPONSE_ENABLED=true
REDIS_URL=redis://your-redis-instance:6379
SECURITY_LOG_LEVEL=info
```

### **Vercel:**
```bash
# Add via Vercel CLI or Dashboard
vercel env add THREAT_DETECTION_ENABLED true
vercel env add AUTO_RESPONSE_ENABLED true
vercel env add SECURITY_LOG_LEVEL info
```

### **Railway:**
```bash
# Add via Railway CLI
railway variables set THREAT_DETECTION_ENABLED=true
railway variables set AUTO_RESPONSE_ENABLED=true
railway variables set REDIS_URL=redis://localhost:6379
```

### **Docker/Kubernetes:**
```yaml
# In your deployment YAML
env:
  - name: THREAT_DETECTION_ENABLED
    value: "true"
  - name: AUTO_RESPONSE_ENABLED
    value: "true"
  - name: REDIS_URL
    value: "redis://redis-service:6379"
```

## 🔧 Environment Validation

The system will validate these variables on startup:

### **Required Variables:**
- `DATABASE_URL` ✅ (already set)
- `REDIS_URL` (for event streaming)
- `THREAT_DETECTION_ENABLED`

### **Optional but Recommended:**
- `AUTO_RESPONSE_ENABLED`
- `SECURITY_LOG_LEVEL`
- Detector thresholds (uses defaults if not set)

## 🚨 Security Notes

### **Sensitive Variables:**
- Keep `DATABASE_URL` secure
- Don't commit webhook URLs to git
- Use secrets management for production
- Rotate security keys regularly

### **Performance Impact:**
- Lower thresholds = more alerts
- Higher scan intervals = less CPU usage
- Adjust based on your traffic volume

## 📋 Quick Copy-Paste for .env

```bash
# Threat Detection System
THREAT_DETECTION_ENABLED=true
AUTO_RESPONSE_ENABLED=true
ANOMALY_SCAN_INTERVAL_MS=60000
SIGNAL_AGG_INTERVAL_MS=45000
SECURITY_LOG_LEVEL=info

# Detection Thresholds
SQL_INJECTION_THRESHOLD=85
CROSS_ORG_THRESHOLD=90
BRUTE_FORCE_THRESHOLD=70
IMPOSSIBLE_TRAVEL_THRESHOLD=75
DATA_EXFIL_THRESHOLD=75
PRIVILEGE_ESC_THRESHOLD=80

# Auto-Response
AUTO_REVOKE_SESSION_THRESHOLD=85
AUTO_BLOCK_IP_THRESHOLD=80
IP_BLOCK_DURATION_MS=86400000

# Redis (optional for streaming)
REDIS_URL=redis://localhost:6379
```

Copy these variables to your deployment platform's environment configuration!