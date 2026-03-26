import React from "react";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageLayout({ title, subtitle, children, actions }: PageLayoutProps) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section
        style={{
          borderRadius: 26,
          border: "1px solid color-mix(in srgb, var(--color-border) 70%, var(--color-accent) 30%)",
          background:
            "radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 12%, transparent) 0%, transparent 30%), linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
          padding: 24,
          boxShadow: "var(--shadow-shell)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start"
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 10px",
                borderRadius: 999,
                background: "var(--color-accent-dim)",
                border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
                color: "var(--color-accent)",
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "'DM Mono', monospace"
              }}
            >
              Workspace
            </div>
            <h1 style={{ margin: "14px 0 0", fontSize: 34, lineHeight: 1.08, color: "var(--color-text-primary)" }}>{title}</h1>
            {subtitle ? (
              <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.7, color: "var(--color-text-secondary)" }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div> : null}
        </div>
      </section>

      <section
        style={{
          borderRadius: 24,
          border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
          padding: 20,
          boxShadow: "var(--shadow-shell)"
        }}
      >
        {children}
      </section>
    </div>
  );
}
