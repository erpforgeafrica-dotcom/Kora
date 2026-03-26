import { useEffect, useRef, useState } from "react";
import * as api from "../services/api";
import type { AnomalyEvent } from "../types/orchestration";

const severityColors = {
  critical: "var(--color-danger)",
  high: "var(--color-warning)",
  medium: "var(--color-accent)",
  low: "var(--color-text-faint)"
};

type RangeShape = { low: number; high: number; zScore?: number; rateOfChange?: number } | [number, number];

function normalizeRange(range: unknown, fallbackZ: number) {
  const value = typeof range === "string" ? (JSON.parse(range) as RangeShape) : (range as RangeShape);
  if (Array.isArray(value)) {
    return { low: value[0] ?? 0, high: value[1] ?? 0, zScore: fallbackZ, rateOfChange: 0 };
  }
  return {
    low: value?.low ?? 0,
    high: value?.high ?? 0,
    zScore: value?.zScore ?? fallbackZ,
    rateOfChange: value?.rateOfChange ?? 0
  };
}

export default function AnomalyFeed() {
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [countdown, setCountdown] = useState(45);
  const [dismissVersion, setDismissVersion] = useState(0);
  const dismissedIds = useRef<Set<string>>(new Set());

  const fetchAnomalies = async () => {
    try {
      const response = await api.getAnomalies();
      setAnomalies(response.anomalies || []);
      setCountdown(45);
    } catch (error) {
      console.error("Failed to fetch anomalies:", error);
    }
  };

  useEffect(() => {
    void fetchAnomalies();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          void fetchAnomalies();
          return 45;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const visible = anomalies.filter((item) => !dismissedIds.current.has(item.id));
  const countdownColor =
    countdown > 20 ? "var(--color-text-faint)" : countdown > 10 ? "var(--color-warning)" : "var(--color-accent)";
  const newCount = visible.filter((item) => {
    const timestamp = new Date((item as AnomalyEvent & { created_at?: string }).detected_at ?? (item as any).created_at).getTime();
    return Date.now() - timestamp < 5 * 60 * 1000;
  }).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 320 }}>
      <style>{`
        @keyframes anomaly-pulse {
          0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-danger) 50%, transparent); }
          50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-danger) 0%, transparent); }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: "0.12em",
              color: "var(--color-accent)",
              fontWeight: 700,
              fontFamily: "'DM Mono', monospace"
            }}
          >
            ANOMALY FEED
          </div>
          {newCount > 0 ? (
            <div
              style={{
                fontSize: 8,
                padding: "2px 6px",
                borderRadius: 3,
                background: "color-mix(in srgb, var(--color-danger) 15%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-danger) 40%, transparent)",
                color: "var(--color-danger)",
                letterSpacing: "0.15em",
                fontWeight: 700
              }}
            >
              [{newCount} NEW]
            </div>
          ) : null}
        </div>
        <div style={{ fontSize: 11, color: countdownColor, fontFamily: "'DM Mono', monospace" }}>[{countdown}s↓]</div>
      </div>

      {visible.length === 0 ? (
        <div
          style={{
            flex: 1,
            borderRadius: 14,
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-2)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 20px",
            gap: 10
          }}
        >
          <div style={{ fontSize: 20, color: "var(--color-accent)" }}>✓</div>
          <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>No anomalies detected</div>
          <div style={{ fontSize: 11, color: "var(--color-text-faint)" }}>Systems operating normally</div>
        </div>
      ) : (
        <div key={dismissVersion} style={{ display: "grid", gap: 8 }}>
          {visible.map((anomaly) => {
            const timestamp = new Date((anomaly as any).detected_at ?? (anomaly as any).created_at);
            const mins = Math.floor((Date.now() - timestamp.getTime()) / 60000);
            const timeAgo = mins < 1 ? "just now" : mins === 1 ? "1 min ago" : `${mins} min ago`;
            const range = normalizeRange((anomaly as any).expected_range, (anomaly as any).z_score ?? 0);
            const metricName = anomaly.metric_name.replace(/_/g, " ").toUpperCase();
            const currentValue = Number((anomaly as any).current_value);
            const unit = anomaly.metric_name.includes("ms") ? "ms" : "";
            const rateOfChange = range.rateOfChange ?? 0;
            const showDelta = Math.abs(rateOfChange) > 0.1;
            const isNew = Date.now() - timestamp.getTime() < 5 * 60 * 1000;
            const severityColor = severityColors[(anomaly.severity as keyof typeof severityColors) ?? "medium"];

            return (
              <article
                key={anomaly.id}
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  padding: "14px 16px",
                  position: "relative",
                  animation: anomaly.severity === "critical" ? "anomaly-pulse 2s infinite" : undefined
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      marginTop: 5,
                      background: severityColor,
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{metricName}</div>
                      <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
                        {currentValue.toLocaleString()}
                        {unit} (normal: {range.low.toLocaleString()}-{range.high.toLocaleString()}
                        {unit})
                      </div>
                      {isNew ? (
                        <div
                          style={{
                            fontSize: 8,
                            padding: "2px 6px",
                            borderRadius: 3,
                            background: "color-mix(in srgb, var(--color-danger) 15%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--color-danger) 40%, transparent)",
                            color: "var(--color-danger)",
                            letterSpacing: "0.15em"
                          }}
                        >
                          NEW
                        </div>
                      ) : null}
                    </div>

                    {showDelta ? (
                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 6,
                          color: rateOfChange > 0 ? "var(--color-warning)" : "var(--color-accent)"
                        }}
                      >
                        {rateOfChange > 0 ? "+" : ""}
                        {(rateOfChange * 100).toFixed(0)}% vs baseline
                      </div>
                    ) : null}

                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "var(--color-text-muted)",
                        fontStyle: "italic"
                      }}
                    >
                      {anomaly.explanation_text}
                    </div>

                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--color-text-faint)" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "color-mix(in srgb, " + severityColor + " 18%, transparent)",
                          color: severityColor,
                          textTransform: "uppercase"
                        }}
                      >
                        {anomaly.severity}
                      </span>
                      <span>·</span>
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      dismissedIds.current.add(anomaly.id);
                      setDismissVersion((value) => value + 1);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--color-text-faint)",
                      fontSize: 16,
                      cursor: "pointer"
                    }}
                  >
                    ×
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
