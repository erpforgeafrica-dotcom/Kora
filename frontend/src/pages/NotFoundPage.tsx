import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 20,
          padding: 28,
          maxWidth: 680
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            color: "var(--color-warning)",
            fontFamily: "'DM Mono', monospace",
            marginBottom: 10
          }}
        >
          ROUTE NOT FOUND
        </div>
        <h1 style={{ margin: 0, fontSize: 28, color: "var(--color-text-primary)" }}>This workspace does not exist yet.</h1>
        <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--color-text-muted)", maxWidth: 560, lineHeight: 1.6 }}>
          The URL you opened is not mapped to a live KORA module. Return to the command dashboard or open the planning
          workspace to continue.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => navigate("/app")}
            style={primaryButtonStyle}
          >
            Go To App
          </button>
          <button
            type="button"
            onClick={() => navigate("/app/planning")}
            style={secondaryButtonStyle}
          >
            Open Planning Center
          </button>
        </div>
      </div>
    </div>
  );
}

const primaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid var(--color-accent)",
  background: "var(--color-accent-dim)",
  color: "var(--color-accent)",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.08em",
  fontFamily: "'DM Mono', monospace",
  cursor: "pointer",
  textTransform: "uppercase" as const
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  border: "1px solid var(--color-border-hover)",
  background: "var(--color-surface-2)",
  color: "var(--color-text-secondary)"
};
