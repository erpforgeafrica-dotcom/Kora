import { type CSSProperties, type ReactNode } from "react";

export function PlanningPageShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        height: "calc(100vh - 76px)",
        background: "var(--color-bg)",
        color: "var(--color-text-primary)",
        fontFamily: "'DM Mono','Fira Code','Courier New',monospace",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      {children}
    </div>
  );
}

export function PlanningHeader({
  compact,
  children
}: {
  compact: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: "color-mix(in srgb, var(--color-surface) 92%, transparent)",
        borderBottom: "1px solid var(--color-border)",
        padding: compact ? "16px" : "16px 28px",
        display: "flex",
        alignItems: compact ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        backdropFilter: "blur(10px)"
      }}
    >
      {children}
    </div>
  );
}

export function PlanningSectionCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function PlanningTabButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "var(--color-accent-dim)" : "transparent",
        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
        color: active ? "var(--color-accent)" : "var(--color-text-muted)",
        padding: "8px 14px",
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        cursor: "pointer",
        fontFamily: "inherit",
        textTransform: "uppercase"
      }}
    >
      {children}
    </button>
  );
}

export function PlanningActionButton({
  active,
  children,
  onClick
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? "var(--color-accent-dim)" : "var(--color-surface-2)",
        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border-hover)"}`,
        color: active ? "var(--color-accent)" : "var(--color-text-secondary)",
        padding: "8px 20px",
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.12em",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 140ms"
      }}
    >
      {children}
    </button>
  );
}
