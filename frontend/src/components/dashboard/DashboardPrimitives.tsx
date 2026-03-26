import { type CSSProperties, type ReactNode } from "react";

export function DashboardPanel({
  title,
  meta,
  children
}: {
  title: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <section style={panelStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
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
        <div style={{ fontSize: 11, color: "var(--color-text-faint)", fontFamily: "'DM Mono', monospace" }}>{meta}</div>
      </div>
      {children}
    </section>
  );
}

export function KpiCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <section style={panelStyle}>
      <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: tone }}>{value}</div>
    </section>
  );
}

export function DashboardList({ items }: { items: string[] }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item) => (
        <div
          key={item}
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            fontSize: 14,
            color: "var(--color-text-secondary)"
          }}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

export const panelStyle: CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 20,
  padding: 18,
  boxShadow: "var(--glow-accent)"
};

export const chartShellStyle: CSSProperties = {
  height: 160,
  borderRadius: 18,
  overflow: "hidden",
  border: "1px solid var(--color-border)",
  background:
    "linear-gradient(180deg, var(--color-accent-dim) 0%, transparent 100%), var(--color-surface-2)",
  position: "relative",
  marginBottom: 12
};

export const chartFillStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 45%, transparent), transparent 65%)"
};

export const bodyTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.6,
  color: "var(--color-text-muted)"
};
