import { type ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: 24
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: 6,
            fontFamily: "'DM Mono', monospace"
          }}
        >
          {title}
        </h3>
        {description && (
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-muted)",
              lineHeight: 1.6,
              margin: 0
            }}
          >
            {description}
          </p>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}
