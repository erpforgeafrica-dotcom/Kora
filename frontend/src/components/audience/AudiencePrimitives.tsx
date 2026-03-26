import type { CSSProperties, ReactNode } from "react";

export function AudienceSection({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <section
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
        border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
        borderRadius: 22,
        padding: 20,
        boxShadow: "var(--shadow-shell)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
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
          {title}
        </div>
        {meta ? <div style={{ fontSize: 11, color: "var(--color-text-faint)", fontFamily: "'DM Mono', monospace" }}>{meta}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function AudienceMetric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div
      style={{
        padding: "18px 18px",
        borderRadius: 18,
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 82%, transparent), color-mix(in srgb, var(--color-surface-2) 90%, transparent))",
        border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)"
      }}
    >
      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: tone ?? "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}

export function StatusPill({ label, tone }: { label: string; tone: "success" | "warning" | "danger" | "accent" | "muted" }) {
  const colorMap: Record<string, string> = {
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
    accent: "var(--color-accent)",
    muted: "var(--color-text-muted)"
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: colorMap[tone],
        border: `1px solid color-mix(in srgb, ${colorMap[tone]} 28%, transparent)`,
        background: `color-mix(in srgb, ${colorMap[tone]} 10%, transparent)`
      }}
    >
      {label}
    </span>
  );
}

export function ActionButton({
  children,
  onClick,
  tone = "accent",
  disabled = false,
  size = "md",
  style
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "accent" | "ghost" | "warning";
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  style?: CSSProperties;
}) {
  const styleMap: Record<string, CSSProperties> = {
    accent: {
      border: "1px solid var(--color-accent)",
      background: "var(--color-accent-dim)",
      color: "var(--color-accent)"
    },
    ghost: {
      border: "1px solid var(--color-border)",
      background: "var(--color-surface-2)",
      color: "var(--color-text-secondary)"
    },
    warning: {
      border: "1px solid color-mix(in srgb, var(--color-warning) 24%, transparent)",
      background: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
      color: "var(--color-warning)"
    }
  };

  const sizeMap: Record<string, CSSProperties> = {
    sm: { padding: "6px 10px", fontSize: 12 },
    md: { padding: "10px 14px", fontSize: 13 },
    lg: { padding: "14px 18px", fontSize: 14 }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        borderRadius: 14,
        fontWeight: 700,
        letterSpacing: "0.05em",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        boxShadow: tone === "accent" ? "var(--glow-accent)" : "none",
        ...styleMap[tone],
        ...sizeMap[size],
        ...style
      }}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      style={{
        padding: "22px 20px",
        borderRadius: 18,
        background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
        border: "1px dashed color-mix(in srgb, var(--color-border) 78%, transparent)"
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 14, color: "var(--color-text-muted)", lineHeight: 1.6 }}>{detail}</div>
    </div>
  );
}

export function formatMoney(amount: number, currency: string = "GBP") {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
}

export function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
