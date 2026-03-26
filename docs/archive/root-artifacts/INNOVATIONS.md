## What world-class systems do that KORA doesn't yet

### 1) Predictive Pre-Fetch Orchestration Cache
- What:
  - Precompute orchestrate-live results per org/role every 30-60s and serve hot cache with freshness metadata.
- Why it matters:
  - Linear/Stripe-grade UX requires near-instant response for operator command surfaces under load.
  - Reduces tail latency and API cost spikes during burst traffic.
- Estimated effort:
  - 3-4 days (worker + cache layer + invalidation + telemetry).

### 2) WebSocket Live Command Stream (replace pure polling)
- What:
  - Push ranked action deltas, policy simulation updates, and anomaly events to clients via channel per organization.
- Why it matters:
  - PagerDuty-class incident workflows depend on push-first updates, not polling lag.
  - Enables sub-second coordination during emergency and finance contention states.
- Estimated effort:
  - 4-6 days (Socket.IO channels, auth gating, backpressure handling, frontend stream consumer).

### 3) Org-level AI Personality Calibration
- What:
  - Policy profile per org: `conservative`, `balanced`, `aggressive`, controlling auto-execution thresholds and required confidence.
- Why it matters:
  - ServiceTitan-style multi-tenant operations need configurable autonomy boundaries by risk appetite.
  - Increases trust and reduces false-action risk in regulated workflows.
- Estimated effort:
  - 2-3 days (org profile table, scoring modifiers, policy gates, admin controls).

## Additional high-leverage upgrade

### SLA breach prediction (prevention, not detection)
- What:
  - Predict breach probability 1-4 hours ahead using rolling incident/bookings/latency/queue features.
- Why it matters:
  - Vercel/Stripe-quality operations systems optimize for proactive prevention.
  - Converts alerts into avoidable incidents, improving reliability and customer trust.
- Estimated effort:
  - 5-7 days (feature extraction pipeline, model baseline, threshold policy, dashboard overlays).
