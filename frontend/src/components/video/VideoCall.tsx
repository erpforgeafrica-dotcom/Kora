import type { VideoSessionRecord } from "../../services/api";

export function VideoCall({ session }: { session: VideoSessionRecord | null }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 18, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ color: "var(--color-text-primary)", fontSize: 16 }}>Video session</div>
        <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>{session?.provider ?? "twilio"}</div>
      </div>
      <div style={{ minHeight: 220, borderRadius: 14, border: "1px solid var(--color-border)", background: "rgba(10,14,22,0.72)", display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        Live streaming surface placeholder
      </div>
      {session?.join_url ? (
        <a href={session.join_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, color: "var(--color-accent)" }}>
          Join secure room
        </a>
      ) : null}
    </div>
  );
}
