# Real-Time Threat Detection System for KORA

**Date**: April 29, 2026  
**Phase**: Security Hardening  
**Priority**: HIGH  
**Scope**: Full platform monitoring and response  

---

## 1. Threat Landscape Analysis

### 1.1 Threats Specific to KORA

| Threat | Impact | Detection Method | Response |
|--------|--------|------------------|----------|
| **Cross-Org Data Leak** | Critical | Query org_id mismatch, API access patterns | Revoke session, alert security |
| **Privilege Escalation** | High | User accessing admin endpoints without role | Deny access, log attempt |
| **Insider Threat** | Critical | Unusual data access, off-hours activity | Session revocation, audit |
| **Brute Force Login** | Medium | 5+ failed attempts in 15min | Lock account, notify user |
| **Compromised Credential** | Critical | Impossible travel, unusual user agent | Revoke all sessions |
| **API Abuse** | High | Rate limit exceeding, repeated errors | IP blocking, DDoS protection |
| **SQL Injection** | Critical | Malformed queries, SQL keywords in params | Query blocking, logging |

### 1.2 Detection Methods Matrix

```
┌──────────────────────────┬────────────────────────┬──────────────────┐
│ Threat Type              │ Detection Mechanism    │ Real-Time Alert? │
├──────────────────────────┼────────────────────────┼──────────────────┤
│ SQL Injection            │ Query pattern matching │ YES - Immediate  │
│ Cross-Org Access         │ Auth context mismatch  │ YES - Immediate  │
│ Brute Force              │ Login attempt counting │ YES - 15 min     │
│ Impossible Travel        │ Geo-IP analysis        │ YES - Immediate  │
│ Data Exfiltration        │ Data volume anomaly    │ YES - 5 min      │
│ Privilege Escalation     │ Role-action mismatch   │ YES - Immediate  │
│ Compromised Token        │ Anomaly scoring        │ YES - 1 min      │
│ API Abuse                │ Rate limiting          │ YES - Immediate  │
└──────────────────────────┴────────────────────────┴──────────────────┘
```

---

## 2. Real-Time Detection Engine

### 2.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 REAL-TIME THREAT DETECTION PIPELINE              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Event Sources:                                                 │
│  • API Gateway (auth events, rate limits)                       │
│  • Database (queries, access patterns)                          │
│  • Frontend (login attempts, navigation)                        │
│  • Infrastructure (IP reputation, WAF)                          │
│                     ↓                                           │
│  Event Aggregator (Redis Stream)                                │
│  • Buffer incoming events                                       │
│  • Deduplicate rapid events                                     │
│                     ↓                                           │
│  Threat Detection Processors (Parallel)                         │
│  • Pattern Matcher (rules engine)                               │
│  • Anomaly Detector (ML model)                                  │
│  • Behavioral Analyzer (user baselines)                         │
│  • Geolocation Checker (impossible travel)                      │
│                     ↓                                           │
│  Threat Scoring & Ranking                                       │
│  • Combine signals into risk score (0-100)                      │
│  • Determine severity level                                     │
│                     ↓                                           │
│  Response Handler (Automated)                                   │
│  • Low (0-30): Log only                                         │
│  • Medium (30-70): Alert + Monitor                              │
│  • High (70-85): Alert + Restrict access                        │
│  • Critical (85-100): Revoke session + Block IP                 │
│                     ↓                                           │
│  Real-Time Alerting (WebSocket + Email/SMS)                     │
│  • Security team notification                                   │
│  • Incident tracking                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Implementation

```typescript
// backend/src/services/threatDetection/engine.ts

import { Redis } from "ioredis";
import { EventEmitter } from "events";
import { logger } from "../../shared/logger.js";

interface ThreatEvent {
  id: string;
  timestamp: Date;
  source: "api" | "database" | "frontend" | "infrastructure";
  type: string;
  userId?: string;
  organizationId?: string;
  metadata: Record<string, any>;
}

interface ThreatSignal {
  threatId: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  userId?: string;
  organizationId?: string;
  detectedAt: Date;
  context: Record<string, any>;
  recommendedActions: string[];
}

/**
 * Real-Time Threat Detection Engine
 * Processes events from all sources and detects threats
 */
export class ThreatDetectionEngine extends EventEmitter {
  private redis: Redis;
  private eventStream = "threat:events";
  private detectorWorkers: Array<ThreatDetector> = [];
  
  constructor(redis: Redis) {
    super();
    this.redis = redis;
    this.initializeDetectors();
  }
  
  private initializeDetectors(): void {
    this.detectorWorkers = [
      new SQLInjectionDetector(),
      new CrossOrgAccessDetector(),
      new BruteForceDetector(),
      new ImpossibleTravelDetector(),
      new DataExfiltratedDetector(),
      new PrivilegeEscalationDetector(),
      new TokenAnomalyDetector(),
      new RateLimitDetector()
    ];
  }
  
  /**
   * Ingest event from any source
   */
  async ingestEvent(event: ThreatEvent): Promise<void> {
    // Add correlation ID for tracing
    event.id = `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // Store in Redis Stream for persistence
    await this.redis.xadd(
      this.eventStream,
      "*",
      "event",
      JSON.stringify(event),
      "timestamp",
      event.timestamp.toISOString()
    );
    
    // Process event through all detectors in parallel
    await this.processEvent(event);
  }
  
  /**
   * Process event through threat detectors
   */
  private async processEvent(event: ThreatEvent): Promise<void> {
    const detections: ThreatSignal[] = [];
    
    // Run all detectors in parallel
    const results = await Promise.allSettled(
      this.detectorWorkers.map(detector => detector.analyze(event))
    );
    
    // Collect threat signals from successful detections
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        detections.push(...result.value);
      } else if (result.status === "rejected") {
        logger.error(`Detector ${index} failed`, result.reason);
      }
    });
    
    // Aggregate signals into final threats
    for (const signal of detections) {
      await this.handleThreatSignal(signal);
    }
  }
  
  /**
   * Handle detected threat signal
   */
  private async handleThreatSignal(signal: ThreatSignal): Promise<void> {
    logger.warn("Threat detected", {
      threatId: signal.threatId,
      type: signal.type,
      severity: signal.severity,
      score: signal.score,
      userId: signal.userId,
      organizationId: signal.organizationId
    });
    
    // Store threat for analytics
    await this.redis.hset(
      `threat:${signal.threatId}`,
      "data",
      JSON.stringify(signal),
      "timestamp",
      Date.now()
    );
    
    // Emit event for real-time handlers
    this.emit("threat-detected", signal);
    
    // Trigger automated response
    await this.respondToThreat(signal);
  }
  
  /**
   * Automated threat response
   */
  private async respondToThreat(signal: ThreatSignal): Promise<void> {
    const responses: Record<string, () => Promise<void>> = {
      LOW: () => this.logThreat(signal),
      MEDIUM: () => this.alertSecurityTeam(signal),
      HIGH: async () => {
        await this.alertSecurityTeam(signal);
        if (signal.userId) {
          await this.restrictUserAccess(signal.userId);
        }
      },
      CRITICAL: async () => {
        await this.alertSecurityTeam(signal);
        await this.notifyExecutives(signal);
        if (signal.userId) {
          await this.revokeUserSession(signal.userId);
          await this.blockIpAddress(signal.metadata.ipAddress);
        }
      }
    };
    
    const severity = signal.severity.toUpperCase();
    const handler = responses[severity];
    if (handler) {
      await handler();
    }
  }
  
  // Response implementations
  private async logThreat(signal: ThreatSignal): Promise<void> {
    await this.redis.lpush(`threats:${signal.severity}`, JSON.stringify(signal));
  }
  
  private async alertSecurityTeam(signal: ThreatSignal): Promise<void> {
    // Publish to security team channel
    await this.redis.publish("security:alerts", JSON.stringify(signal));
  }
  
  private async notifyExecutives(signal: ThreatSignal): Promise<void> {
    // Send critical alerts to executives
    await this.redis.publish("critical:alerts", JSON.stringify(signal));
  }
  
  private async restrictUserAccess(userId: string): Promise<void> {
    // Add user to restricted list (rate limited, require MFA)
    await this.redis.sadd(`restricted:users`, userId);
    await this.redis.expire(`restricted:users:${userId}`, 3600); // 1 hour
  }
  
  private async revokeUserSession(userId: string): Promise<void> {
    // Revoke all active sessions for user
    const sessions = await this.redis.keys(`session:${userId}:*`);
    if (sessions.length > 0) {
      await this.redis.del(...sessions);
    }
  }
  
  private async blockIpAddress(ipAddress: string): Promise<void> {
    // Add IP to blocklist (24 hours)
    await this.redis.setex(`blocked:ip:${ipAddress}`, 86400, "1");
  }
}

/**
 * Base threat detector interface
 */
abstract class ThreatDetector {
  abstract analyze(event: ThreatEvent): Promise<ThreatSignal[]>;
}
```

### 2.3 Specific Detectors

```typescript
// backend/src/services/threatDetection/detectors/

/**
 * SQL Injection Detector
 */
export class SQLInjectionDetector extends ThreatDetector {
  async analyze(event: ThreatEvent): Promise<ThreatSignal[]> {
    if (event.source !== "database") return [];
    
    const signals: ThreatSignal[] = [];
    const query = event.metadata.query || "";
    
    // Check for SQL keywords in parameters (likely injection)
    const sqlKeywords = [
      "DROP", "DELETE", "INSERT", "UPDATE", "UNION", 
      "SELECT", "EXEC", "EXECUTE", "--", "/*", "*/"
    ];
    
    const params = event.metadata.params || [];
    params.forEach((param: any) => {
      const paramStr = String(param).toUpperCase();
      
      if (sqlKeywords.some(keyword => paramStr.includes(keyword))) {
        signals.push({
          threatId: `sql_injection_${Date.now()}`,
          type: "SQL_INJECTION_ATTEMPT",
          severity: "critical",
          score: 95,
          userId: event.userId,
          organizationId: event.organizationId,
          detectedAt: new Date(),
          context: { query, suspiciousParam: param },
          recommendedActions: [
            "Block query execution",
            "Revoke user session",
            "Alert security team"
          ]
        });
      }
    });
    
    return signals;
  }
}

/**
 * Cross-Organization Access Detector
 */
export class CrossOrgAccessDetector extends ThreatDetector {
  async analyze(event: ThreatEvent): Promise<ThreatSignal[]> {
    if (event.source !== "database") return [];
    
    const signals: ThreatSignal[] = [];
    
    // Check if user's org_id matches requested resource's org_id
    if (
      event.metadata.userOrgId &&
      event.metadata.resourceOrgId &&
      event.metadata.userOrgId !== event.metadata.resourceOrgId
    ) {
      signals.push({
        threatId: `cross_org_${Date.now()}`,
        type: "CROSS_ORG_ACCESS",
        severity: "critical",
        score: 100,
        userId: event.userId,
        organizationId: event.organizationId,
        detectedAt: new Date(),
        context: {
          userOrgId: event.metadata.userOrgId,
          resourceOrgId: event.metadata.resourceOrgId,
          resourceId: event.metadata.resourceId,
          resourceType: event.metadata.resourceType
        },
        recommendedActions: [
          "Deny query",
          "Log access attempt",
          "Investigate user"
        ]
      });
    }
    
    return signals;
  }
}

/**
 * Brute Force Attack Detector
 */
export class BruteForceDetector extends ThreatDetector {
  async analyze(event: ThreatEvent): Promise<ThreatSignal[]> {
    if (event.type !== "login_failed") return [];
    
    const signals: ThreatSignal[] = [];
    const email = event.metadata.email;
    const ipAddress = event.metadata.ipAddress;
    
    // Get recent failures for this email
    const failureKey = `login:failures:${email}`;
    const recentFailures = await this.redis.incr(failureKey);
    await this.redis.expire(failureKey, 900); // 15 minute window
    
    if (recentFailures > 5) {
      signals.push({
        threatId: `brute_force_${Date.now()}`,
        type: "BRUTE_FORCE_ATTACK",
        severity: recentFailures > 10 ? "critical" : "high",
        score: Math.min(30 + recentFailures * 5, 100),
        userId: email,
        organizationId: "SYSTEM",
        detectedAt: new Date(),
        context: {
          failureCount: recentFailures,
          email,
          ipAddress
        },
        recommendedActions: [
          "Lock account temporarily",
          "Block IP address",
          "Send password reset email to user"
        ]
      });
    }
    
    return signals;
  }
  
  private redis: Redis;
  constructor(redis?: Redis) {
    super();
    this.redis = redis || new Redis();
  }
}

/**
 * Impossible Travel Detector
 * Detect if user is in two locations too quickly
 */
export class ImpossibleTravelDetector extends ThreatDetector {
  async analyze(event: ThreatEvent): Promise<ThreatSignal[]> {
    if (!event.userId) return [];
    
    const signals: ThreatSignal[] = [];
    
    // Get last known location
    const lastLocation = await this.getLastLocation(event.userId);
    if (!lastLocation) return []; // First access
    
    const currentLocation = await this.getGeoLocation(event.metadata.ipAddress);
    const distance = this.calculateDistance(lastLocation, currentLocation);
    const timeDelta = event.timestamp.getTime() - lastLocation.timestamp.getTime();
    const maxSpeed = 900; // km/h (commercial flight)
    const calculatedSpeed = distance / (timeDelta / 3600000);
    
    if (calculatedSpeed > maxSpeed) {
      signals.push({
        threatId: `impossible_travel_${Date.now()}`,
        type: "IMPOSSIBLE_TRAVEL",
        severity: "high",
        score: 85,
        userId: event.userId,
        organizationId: event.organizationId,
        detectedAt: new Date(),
        context: {
          lastLocation: lastLocation.city,
          currentLocation: currentLocation.city,
          distance,
          requiredSpeed: calculatedSpeed,
          maxSpeed
        },
        recommendedActions: [
          "Require additional MFA",
          "Notify user of suspicious activity",
          "Monitor subsequent access"
        ]
      });
    }
    
    // Store current location
    await this.storeLocation(event.userId, currentLocation);
    
    return signals;
  }
  
  private async getLastLocation(userId: string): Promise<any> {
    // Fetch from Redis
    const data = await this.redis.get(`user:location:${userId}`);
    return data ? JSON.parse(data) : null;
  }
  
  private async getGeoLocation(ipAddress: string): Promise<any> {
    // Call GeoIP API
    return { lat: 0, lon: 0, city: "Unknown" }; // Implement actual GeoIP
  }
  
  private calculateDistance(loc1: any, loc2: any): number {
    // Haversine formula for distance
    return 0; // Implement calculation
  }
  
  private async storeLocation(userId: string, location: any): Promise<void> {
    await this.redis.setex(
      `user:location:${userId}`,
      86400,
      JSON.stringify({ ...location, timestamp: new Date() })
    );
  }
  
  private redis: Redis = new Redis();
}

/**
 * Data Exfiltration Detector
 * Detect unusual data access volume
 */
export class DataExfiltratedDetector extends ThreatDetector {
  async analyze(event: ThreatEvent): Promise<ThreatSignal[]> {
    if (event.source !== "database") return [];
    
    const signals: ThreatSignal[] = [];
    const userId = event.userId;
    const accessSize = event.metadata.rowsReturned || 0;
    
    // Get user's access baseline
    const baseline = await this.getAccessBaseline(userId);
    
    // Flag if accessing 10x more data than normal
    if (accessSize > baseline.avgSize * 10) {
      signals.push({
        threatId: `data_exfil_${Date.now()}`,
        type: "DATA_EXFILTRATION_ATTEMPT",
        severity: "high",
        score: 80,
        userId: event.userId,
        organizationId: event.organizationId,
        detectedAt: new Date(),
        context: {
          accessSize,
          baselineSize: baseline.avgSize,
          multiplier: accessSize / baseline.avgSize
        },
        recommendedActions: [
          "Restrict user access",
          "Audit data access logs",
          "Notify data owner"
        ]
      });
    }
    
    return signals;
  }
  
  private async getAccessBaseline(userId: string): Promise<any> {
    // Calculate average from historical data
    return { avgSize: 100 }; // Implement calculation
  }
  
  private redis: Redis = new Redis();
}
```

---

## 3. Real-Time Dashboard

### 3.1 API Endpoints

```typescript
// backend/src/modules/security/threatDashboard.routes.ts

import { Router } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth.js";

export const threatDashboardRoutes = Router();

/**
 * GET /api/security/threats/active
 * Real-time active threats
 */
threatDashboardRoutes.get("/threats/active", requireAuth, requireAdmin, async (req, res) => {
  const redis = getRedisClient();
  
  // Get active threats (last 24 hours)
  const threats = await redis.zrange("active:threats", 0, -1, "WITHSCORES");
  
  const formatted = threats.reduce((acc, threat, i) => {
    if (i % 2 === 0) {
      const data = JSON.parse(threat);
      acc.push({
        ...data,
        score: threats[i + 1]
      });
    }
    return acc;
  }, []);
  
  res.json({
    count: formatted.length,
    threats: formatted.sort((a, b) => b.score - a.score)
  });
});

/**
 * GET /api/security/threats/:threatId
 * Threat details and context
 */
threatDashboardRoutes.get("/threats/:threatId", requireAuth, requireAdmin, async (req, res) => {
  const redis = getRedisClient();
  const threatData = await redis.hgetall(`threat:${req.params.threatId}`);
  
  res.json({
    threat: JSON.parse(threatData.data),
    timeline: await getThreatTimeline(req.params.threatId),
    relatedEvents: await getRelatedEvents(req.params.threatId)
  });
});

/**
 * GET /api/security/metrics
 * Real-time security metrics
 */
threatDashboardRoutes.get("/metrics", requireAuth, requireAdmin, async (req, res) => {
  const redis = getRedisClient();
  
  const metrics = {
    activeThreats: await redis.zcard("active:threats"),
    failedLogins: await redis.get("metrics:failed_logins:24h") || 0,
    crossOrgAttempts: await redis.get("metrics:cross_org_attempts:24h") || 0,
    sessionsRevoked: await redis.get("metrics:sessions_revoked:24h") || 0,
    ipsBlocked: await redis.smembers("blocked:ips"),
    usersRestricted: await redis.smembers("restricted:users")
  };
  
  res.json(metrics);
});

/**
 * WebSocket: Real-time threat stream
 */
threatDashboardRoutes.ws("/threats/stream", (ws, req) => {
  const redis = getRedisClient();
  
  // Subscribe to threat alerts
  redis.subscribe("security:alerts", (err, count) => {
    if (err) {
      ws.send(JSON.stringify({ error: "Subscription failed" }));
      return;
    }
  });
  
  redis.on("message", (channel, message) => {
    if (channel === "security:alerts") {
      ws.send(message);
    }
  });
  
  ws.on("close", () => {
    redis.unsubscribe("security:alerts");
  });
});
```

### 3.2 Frontend Dashboard

```typescript
// frontend/src/pages/SecurityDashboard.tsx

import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export function SecurityDashboard() {
  const [threats, setThreats] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [stream, setStream] = useState(null);
  
  useEffect(() => {
    // Fetch initial data
    fetchMetrics();
    
    // Connect to real-time stream
    const ws = new WebSocket("ws://localhost:3000/api/security/threats/stream");
    
    ws.onmessage = (event) => {
      const threat = JSON.parse(event.data);
      setThreats(prev => [threat, ...prev].slice(0, 20)); // Keep last 20
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    return () => ws.close();
  }, []);
  
  async function fetchMetrics() {
    const response = await fetch("/api/security/metrics", {
      credentials: "include"
    });
    setMetrics(await response.json());
  }
  
  return (
    <div className="security-dashboard">
      <h1>Security Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="metrics-grid">
        <Card title="Active Threats" value={metrics?.activeThreats} severity="high" />
        <Card title="Failed Logins" value={metrics?.failedLogins} severity="medium" />
        <Card title="Cross-Org Attempts" value={metrics?.crossOrgAttempts} severity="critical" />
        <Card title="Sessions Revoked" value={metrics?.sessionsRevoked} severity="high" />
      </div>
      
      {/* Real-Time Threat Feed */}
      <section className="threat-feed">
        <h2>Real-Time Threat Stream</h2>
        {threats.map(threat => (
          <ThreatAlert
            key={threat.threatId}
            threat={threat}
            onDismiss={() => setThreats(prev => 
              prev.filter(t => t.threatId !== threat.threatId)
            )}
          />
        ))}
      </section>
      
      {/* Charts */}
      <section className="charts">
        <LineChart data={threats} width={800} height={300}>
          <CartesianGrid />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Line type="monotone" dataKey="score" stroke="#ff0000" />
        </LineChart>
      </section>
    </div>
  );
}

function ThreatAlert({ threat, onDismiss }: any) {
  const severityColors = {
    low: "bg-yellow-100",
    medium: "bg-orange-100",
    high: "bg-red-100",
    critical: "bg-red-800 text-white"
  };
  
  return (
    <div className={`threat-alert ${severityColors[threat.severity]}`}>
      <div className="threat-header">
        <h3>{threat.type}</h3>
        <span className="severity">{threat.severity.toUpperCase()}</span>
        <span className="score">Score: {threat.score}/100</span>
      </div>
      
      <div className="threat-details">
        {threat.userId && <p>User: {threat.userId}</p>}
        {threat.organizationId && <p>Org: {threat.organizationId}</p>}
        {threat.context && (
          <details>
            <summary>Details</summary>
            <pre>{JSON.stringify(threat.context, null, 2)}</pre>
          </details>
        )}
      </div>
      
      <div className="threat-actions">
        {threat.recommendedActions.map((action: string) => (
          <button key={action} className="btn-action">
            {action}
          </button>
        ))}
        <button onClick={onDismiss} className="btn-dismiss">Dismiss</button>
      </div>
    </div>
  );
}
```

---

## 4. Testing & Validation

```typescript
// backend/src/test/threatDetection.test.ts

describe("Real-Time Threat Detection", () => {
  let engine: ThreatDetectionEngine;
  
  beforeEach(async () => {
    engine = new ThreatDetectionEngine(redis);
  });
  
  it("should detect SQL injection attempts", async () => {
    const threatPromise = new Promise(resolve => {
      engine.once("threat-detected", resolve);
    });
    
    await engine.ingestEvent({
      id: "test",
      timestamp: new Date(),
      source: "database",
      type: "query",
      userId: "user1",
      organizationId: "org1",
      metadata: {
        query: "SELECT * FROM users WHERE id = $1",
        params: ["1'; DROP TABLE users; --"]
      }
    });
    
    const threat = await threatPromise;
    expect(threat.type).toBe("SQL_INJECTION_ATTEMPT");
    expect(threat.severity).toBe("critical");
  });
  
  it("should detect cross-org access", async () => {
    const threatPromise = new Promise(resolve => {
      engine.once("threat-detected", resolve);
    });
    
    await engine.ingestEvent({
      id: "test",
      timestamp: new Date(),
      source: "database",
      type: "query",
      userId: "user1",
      organizationId: "org1",
      metadata: {
        query: "SELECT * FROM bookings",
        userOrgId: "org1",
        resourceOrgId: "org2", // Mismatch!
        resourceId: "booking_123"
      }
    });
    
    const threat = await threatPromise;
    expect(threat.type).toBe("CROSS_ORG_ACCESS");
    expect(threat.severity).toBe("critical");
  });
  
  it("should detect brute force attacks", async () => {
    // Simulate 6 failed login attempts in 15 minutes
    for (let i = 0; i < 6; i++) {
      await engine.ingestEvent({
        id: `test_${i}`,
        timestamp: new Date(),
        source: "api",
        type: "login_failed",
        userId: "attacker@example.com",
        organizationId: "SYSTEM",
        metadata: {
          email: "victim@example.com",
          ipAddress: "192.168.1.100"
        }
      });
    }
    
    const threat = await waitForThreat();
    expect(threat.type).toBe("BRUTE_FORCE_ATTACK");
    expect(threat.severity).toMatch(/high|critical/);
  });
});
```

---

## 5. Deployment Configuration

```yaml
# docker-compose.yml (additions for threat detection)

services:
  threat-detector:
    image: kora/threat-detector:latest
    environment:
      REDIS_URL: redis://redis:6379
      LOG_LEVEL: info
      THREAT_ALERT_THRESHOLD: 70
    depends_on:
      - redis
    ports:
      - "5000:5000"  # Metrics endpoint
    volumes:
      - ./backend/src/services/threatDetection:/app/src
```

---

## 6. Monitoring & Observability

### 6.1 Key Metrics

```typescript
// Prometheus metrics
- threat_detection_engine_events_processed_total
- threat_detection_engine_threats_detected_total
- threat_detection_engine_response_time_ms
- threat_alert_send_latency_ms
- threat_detector_processor_latency_ms{detector="sql_injection"}
- threat_score_distribution (histogram)
- active_threat_count (gauge)
```

### 6.2 Alerting

```yaml
# Prometheus alerting rules
groups:
  - name: security
    rules:
      - alert: CriticalThreatDetected
        expr: threat_severity == "critical"
        for: 1m
        annotations:
          summary: "Critical security threat detected"
          
      - alert: BruteForceAttack
        expr: threat_type == "BRUTE_FORCE_ATTACK"
        for: 5m
        annotations:
          summary: "Brute force attack in progress"
```

---

## 7. Incident Response Playbook

### 7.1 Critical Threat (Score 85+)

1. **Immediate** (0-5 min):
   - [ ] Revoke user session
   - [ ] Block source IP for 24 hours
   - [ ] Alert security team via SMS
   - [ ] Page on-call security engineer

2. **Short-term** (5-30 min):
   - [ ] Investigate threat context
   - [ ] Review user's recent access logs
   - [ ] Check for data exfiltration
   - [ ] Notify affected organization

3. **Follow-up** (30 min+):
   - [ ] Conduct forensics analysis
   - [ ] Update threat detection rules
   - [ ] Document incident
   - [ ] Conduct post-mortem

---

## Next Steps

1. Deploy threat detection engine to production
2. Train security team on dashboard
3. Establish incident response procedures
4. Monitor false positive rate
5. Continuously improve detection algorithms

