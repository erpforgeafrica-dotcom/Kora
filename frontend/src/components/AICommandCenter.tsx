import { type CSSProperties, useEffect, useState } from "react";
import type { LiveOrchestrationResult, PolicyOutcome, ScoredAction } from "../types/orchestration";

interface AICommandCenterProps {
  loading: boolean;
  error: string | null;
  result: LiveOrchestrationResult | null;
  onAccept: (actionId: string, fingerprint: string) => Promise<void>;
  onReject: (actionId: string, fingerprint: string) => Promise<void>;
  onSimulate: (actionId: string) => void;
  lastRefreshed: number;
  autoRefreshInterval: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "var(--color-danger)",
  high: "var(--color-warning)",
  medium: "var(--color-accent)",
  low: "var(--color-text-muted)"
};

const MODULE_COLORS: Record<string, string> = {
  emergency: "var(--color-danger)",
  finance: "var(--color-warning)",
  clinical: "color-mix(in srgb, var(--color-accent) 70%, var(--color-success) 30%)",
  bookings: "color-mix(in srgb, var(--color-accent) 72%, var(--color-text-secondary) 28%)",
  auth: "color-mix(in srgb, var(--color-accent) 48%, var(--color-text-secondary) 52%)",
  notifications: "color-mix(in srgb, var(--color-danger) 42%, var(--color-accent) 58%)",
  reporting: "color-mix(in srgb, var(--color-accent) 62%, var(--color-success) 38%)",
  ai: "var(--color-accent)"
};

function AIStandbyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 32px",
        gap: 16,
        textAlign: "center"
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "1px solid var(--color-accent)",
          opacity: 0.4,
          animation: "orbit-pulse 2.5s ease-in-out infinite",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "1px solid var(--color-accent)",
            opacity: 0.6
          }}
        />
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-text-muted)",
            letterSpacing: "0.12em",
            fontFamily: "'DM Mono', monospace",
            marginBottom: 6
          }}
        >
          AI INTELLIGENCE STANDBY
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--color-text-faint)",
            fontFamily: "'DM Mono', monospace",
            lineHeight: 1.6,
            maxWidth: 320
          }}
        >
          {message || "Waiting for backend connection. Start the API server to activate command intelligence."}
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          color: "var(--color-text-faint)",
          fontFamily: "'DM Mono', monospace",
          padding: "6px 14px",
          background: "var(--color-accent-dim)",
          border: "1px solid var(--color-border)",
          borderRadius: 6
        }}
      >
        npm run dev  ·  Terminal A
      </div>
    </div>
  );
}

export function AICommandCenter({
  loading,
  error,
  result,
  onAccept,
  onReject,
  onSimulate,
  lastRefreshed,
  autoRefreshInterval
}: AICommandCenterProps) {
  const [expandedReasoningId, setExpandedReasoningId] = useState<string | null>(null);
  const [expandedFollowUpId, setExpandedFollowUpId] = useState<string | null>(null);
  const [feedbackInProgress, setFeedbackInProgress] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(0);

  useEffect(() => {
    if (!lastRefreshed) {
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Date.now() - lastRefreshed;
      const remaining = Math.max(0, Math.ceil((autoRefreshInterval - elapsed) / 1000));
      setSecondsUntilRefresh(remaining);
    }, 250);

    return () => clearInterval(timer);
  }, [lastRefreshed, autoRefreshInterval]);

  const handleFeedback = async (actionId: string, outcome: "accepted" | "rejected") => {
    try {
      setFeedbackInProgress(actionId);
      if (outcome === "accepted") {
        await onAccept(actionId, `${actionId}_fingerprint`);
      } else {
        await onReject(actionId, `${actionId}_fingerprint`);
      }
    } finally {
      setFeedbackInProgress(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-2)",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-accent)", animation: "pulse 2s infinite" }} />
        <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>AI is analyzing your operations...</div>
      </div>
    );
  }

  if (error) {
    const lowerError = error.toLowerCase();
    const isOffline =
      lowerError.includes("network") ||
      lowerError.includes("fetch") ||
      lowerError.includes("connect") ||
      lowerError.includes("econnrefused");

    if (isOffline) {
      return <AIStandbyState message="AI command engine is offline. Activate the backend to begin intelligence." />;
    }

    return (
      <div
        style={{
          padding: 20,
          background: "color-mix(in srgb, var(--color-danger) 6%, transparent)",
          border: "1px solid color-mix(in srgb, var(--color-danger) 20%, transparent)",
          borderRadius: 8,
          color: "var(--color-danger)",
          fontSize: 12,
          fontFamily: "'DM Mono', monospace"
        }}
      >
        Intelligence error - {error}
      </div>
    );
  }

  if (!result || result.prioritizedActions.length === 0) {
    return (
      <div
        style={{
          borderRadius: 16,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-2)",
          padding: 28,
          textAlign: "center"
        }}
      >
        <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 6 }}>No actions to prioritize</div>
        <div style={{ fontSize: 12, color: "var(--color-text-faint)", fontFamily: "'DM Mono', monospace" }}>
          All systems operating normally
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid var(--color-border)",
          background: "linear-gradient(90deg, var(--color-surface-2), transparent)"
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: "var(--color-accent)",
              fontWeight: 700,
              letterSpacing: "0.12em",
              fontFamily: "'DM Mono', monospace",
              textTransform: "uppercase"
            }}
          >
            AI Command Intelligence
          </div>
          <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
            Analyzing {result.signals.totalMetricsAnalyzed} signals across {result.signals.modulesQueried.length} modules
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-faint)", fontFamily: "'DM Mono', monospace" }}>
          [LIVE] {secondsUntilRefresh}s
        </div>
      </div>

      {result.prioritizedActions.map((action, index) => (
        <CommandActionCard
          key={action.id}
          action={action}
          rank={index + 1}
          isExpanded={expandedReasoningId === action.id}
          isFollowUpExpanded={expandedFollowUpId === action.id}
          feedbackInProgress={feedbackInProgress === action.id}
          onExpandReasoning={() => setExpandedReasoningId(expandedReasoningId === action.id ? null : action.id)}
          onExpandFollowUp={() => setExpandedFollowUpId(expandedFollowUpId === action.id ? null : action.id)}
          onAccept={() => handleFeedback(action.id, "accepted")}
          onReject={() => handleFeedback(action.id, "rejected")}
          onSimulate={() => onSimulate(action.id)}
        />
      ))}

      {result.nextActionRecommendation ? (
        <div
          style={{
            borderRadius: 14,
            border: "1px solid var(--color-accent-strong)",
            background: "var(--color-accent-dim)",
            padding: 14
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--color-accent)",
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 6
            }}
          >
            Next Recommended Action
          </div>
          <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>{result.nextActionRecommendation}</div>
        </div>
      ) : null}

      {result.policyOutcomes?.length ? <PolicyOutcomesSection policies={result.policyOutcomes} /> : null}
    </div>
  );
}

function CommandActionCard({
  action,
  rank,
  isExpanded,
  onExpandReasoning,
  isFollowUpExpanded,
  onExpandFollowUp,
  feedbackInProgress,
  onAccept,
  onReject,
  onSimulate
}: {
  action: ScoredAction;
  rank: number;
  isExpanded: boolean;
  onExpandReasoning: () => void;
  isFollowUpExpanded: boolean;
  onExpandFollowUp: () => void;
  feedbackInProgress: boolean;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onSimulate: () => void;
}) {
  const severityColor = SEVERITY_COLORS[action.severity] ?? "var(--color-accent)";
  const moduleColor = MODULE_COLORS[action.sourceModule] ?? "var(--color-text-muted)";

  return (
    <section
      style={{
        borderRadius: 18,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-2)",
        overflow: "hidden"
      }}
    >
      <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-surface)",
            color: moduleColor,
            fontWeight: 700
          }}
        >
          {rank}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 14, color: "var(--color-text-primary)" }}>{action.title}</h3>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                background: "color-mix(in srgb, " + severityColor + " 18%, transparent)",
                color: severityColor,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                fontFamily: "'DM Mono', monospace",
                textTransform: "uppercase"
              }}
            >
              {action.severity}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--color-text-muted)" }}>
            <span style={{ color: moduleColor, fontFamily: "'DM Mono', monospace" }}>{action.sourceModule.toUpperCase()}</span>
            <span>·</span>
            <span>Confidence {(action.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>

        <div style={{ width: 140 }}>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>{action.score.toFixed(1)}</div>
          <div style={{ height: 6, borderRadius: 999, background: "var(--color-border)", overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.min(action.score, 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: severityColor
              }}
            />
          </div>
        </div>
      </div>

      {isExpanded ? (
        <div style={{ borderTop: "1px solid var(--color-border)", padding: 16, background: "var(--color-surface)" }}>
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-muted)",
              fontWeight: 700,
              letterSpacing: "0.12em",
              fontFamily: "'DM Mono', monospace",
              marginBottom: 10
            }}
          >
            REASONING ANALYSIS
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
            {action.reasoning.map((reason) => (
              <li key={reason} style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {action.followUpChain.length ? (
        <div style={{ borderTop: "1px solid var(--color-border)", background: isFollowUpExpanded ? "var(--color-surface)" : "transparent" }}>
          <button
            type="button"
            onClick={onExpandFollowUp}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "12px 16px",
              border: "none",
              background: "transparent",
              color: "var(--color-text-muted)",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace",
              cursor: "pointer"
            }}
          >
            {isFollowUpExpanded ? "▼" : "▶"} FOLLOW-UP CHAIN ({action.followUpChain.length})
          </button>

          {isFollowUpExpanded ? (
            <div style={{ padding: "0 16px 14px", display: "grid", gap: 8 }}>
              {action.followUpChain.map((item) => {
                const [moduleName, ...rest] = item.split(":");
                const text = rest.join(":").trim();
                const moduleKey = moduleName.toLowerCase();
                return (
                  <div key={item} style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
                    <span style={{ color: MODULE_COLORS[moduleKey] ?? "var(--color-accent)", fontFamily: "'DM Mono', monospace" }}>
                      {moduleKey.toUpperCase()}
                    </span>{" "}
                    <span style={{ color: "var(--color-text-faint)" }}>→</span> {text}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "color-mix(in srgb, var(--color-surface) 85%, transparent)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}
      >
        <button type="button" onClick={onExpandReasoning} style={ghostButtonStyle}>
          {isExpanded ? "▼" : "▶"} Reasoning
        </button>
        <div style={{ flex: 1 }} />
        <button type="button" disabled={feedbackInProgress} onClick={() => void onAccept()} style={primaryButtonStyle}>
          {feedbackInProgress ? "..." : "Accept"}
        </button>
        <button type="button" disabled={feedbackInProgress} onClick={() => void onReject()} style={secondaryButtonStyle}>
          {feedbackInProgress ? "..." : "Dismiss"}
        </button>
        <button type="button" onClick={onSimulate} style={warningButtonStyle}>
          Simulate
        </button>
      </div>
    </section>
  );
}

function PolicyOutcomesSection({ policies }: { policies: PolicyOutcome[] }) {
  return (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-2)",
        padding: 16
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "var(--color-text-muted)",
          fontWeight: 700,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.12em",
          marginBottom: 12
        }}
      >
        POLICY OUTCOMES
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {policies.map((policy) => (
          <div key={policy.policyId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: policy.executed ? "var(--color-accent-dim)" : "color-mix(in srgb, var(--color-warning) 18%, transparent)",
                color: policy.executed ? "var(--color-accent)" : "var(--color-warning)",
                fontSize: 12,
                fontWeight: 700
              }}
            >
              {policy.executed ? "✓" : "!"}
            </span>
            <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>{policy.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const ghostButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--color-text-muted)",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'DM Mono', monospace"
};

const primaryButtonStyle: CSSProperties = {
  border: "1px solid var(--color-accent-strong)",
  background: "var(--color-accent-dim)",
  color: "var(--color-accent)",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'DM Mono', monospace"
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid var(--color-border)",
  background: "var(--color-surface)",
  color: "var(--color-text-secondary)",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'DM Mono', monospace"
};

const warningButtonStyle: CSSProperties = {
  border: "1px solid color-mix(in srgb, var(--color-warning) 25%, transparent)",
  background: "color-mix(in srgb, var(--color-warning) 14%, transparent)",
  color: "var(--color-warning)",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "'DM Mono', monospace"
};
