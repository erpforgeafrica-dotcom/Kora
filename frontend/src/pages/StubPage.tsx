export default function StubPage({ title }: { title: string }) {
  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          padding: 32,
          maxWidth: 560,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--color-accent)",
            fontFamily: "'DM Mono', monospace",
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          Coming Soon
        </div>
        <h1 style={{ margin: 0, fontSize: 24, color: "var(--color-text-primary)" }}>{title}</h1>
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
          This module is scheduled for a future phase. Check the Planning Center for the build timeline.
        </p>
      </div>
    </div>
  );
}
