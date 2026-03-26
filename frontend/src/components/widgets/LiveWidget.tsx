import { useEffect, useState, type ReactNode } from "react";

interface LiveWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon?: ReactNode;
  color?: string;
  loading?: boolean;
}

export function LiveWidget({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = "var(--color-accent)",
  loading = false
}: LiveWidgetProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 16,
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      {pulse && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: color,
            animation: "slideIn 0.6s ease-out",
          }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {title}
        </div>
        {icon && <div style={{ color, opacity: 0.8 }}>{icon}</div>}
      </div>

      <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8, opacity: loading ? 0.5 : 1 }}>
        {loading ? "..." : value}
      </div>

      {subtitle && (
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 8 }}>
          {subtitle}
        </div>
      )}

      {trend && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            fontWeight: 600,
            color: trend.value >= 0 ? "var(--color-success)" : "var(--color-danger)",
            padding: "4px 8px",
            borderRadius: 8,
            background: trend.value >= 0 ? "color-mix(in srgb, var(--color-success) 10%, transparent)" : "color-mix(in srgb, var(--color-danger) 10%, transparent)",
          }}
        >
          <span>{trend.value >= 0 ? "▲" : "▼"}</span>
          <span>{Math.abs(trend.value).toFixed(1)}%</span>
          <span style={{ opacity: 0.7 }}>{trend.label}</span>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
