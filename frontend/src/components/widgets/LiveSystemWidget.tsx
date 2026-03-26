import { useEffect, useState } from "react";

interface SystemHealth {
  name: string;
  status: "healthy" | "warning" | "critical";
  value: number;
  unit: string;
}

export function LiveSystemWidget() {
  const [systems, setSystems] = useState<SystemHealth[]>([
    { name: "CPU Usage", status: "healthy", value: 42, unit: "%" },
    { name: "Memory", status: "healthy", value: 67, unit: "%" },
    { name: "Database", status: "healthy", value: 98, unit: "% uptime" },
    { name: "API Response", status: "healthy", value: 145, unit: "ms" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSystems((prev) =>
        prev.map((system) => ({
          ...system,
          value: system.value + (Math.random() - 0.5) * 20,
          status: Math.random() > 0.8 ? "warning" : "healthy"
        }))
      );
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "var(--color-success)";
      case "warning":
        return "var(--color-warning)";
      case "critical":
        return "var(--color-danger)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "healthy":
        return "✓ Healthy";
      case "warning":
        return "⚠ Warning";
      case "critical":
        return "✕ Critical";
      default:
        return "Unknown";
    }
  };

  const healthyCount = systems.filter((s) => s.status === "healthy").length;
  const overallStatus = healthyCount === systems.length ? "All Systems Operational" : "Issues Detected";

  return (
    <div
      style={{
        padding: "clamp(16px, 4vw, 20px)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: "clamp(12px, 3vw, 16px)"
      }}
    >
      <div>
        <div
          style={{
            fontSize: "clamp(9px, 1.8vw, 10px)",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.12em",
            color: "var(--color-text-muted)",
            fontWeight: 700,
            marginBottom: 4
          }}
        >
          SYSTEM HEALTH
        </div>
        <h3 style={{ margin: 0, fontSize: "clamp(18px, 3.5vw, 20px)", color: "var(--color-text-primary)" }}>
          {overallStatus}
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 2vw, 12px)" }}>
        {systems.map((system) => (
          <div key={system.name}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "clamp(4px, 1vw, 6px)",
                fontSize: "clamp(11px, 2vw, 12px)"
              }}
            >
              <span style={{ color: "var(--color-text-secondary)" }}>{system.name}</span>
              <span style={{ color: getStatusColor(system.status), fontWeight: 700 }}>
                {Math.round(system.value)} {system.unit}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: "var(--color-surface-2)",
                borderRadius: 3,
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(system.value, 100)}%`,
                  background: getStatusColor(system.status),
                  transition: "width 400ms ease",
                  borderRadius: 3
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 12,
          background: "var(--color-surface-2)",
          borderRadius: 8,
          textAlign: "center",
          fontSize: 12,
          color: "var(--color-success)",
          fontWeight: 700
        }}
      >
        ✓ Last updated: now
      </div>
    </div>
  );
}
