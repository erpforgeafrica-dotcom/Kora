import type { VideoRecordingRecord } from "../../services/api";

export function RecordingPlayer({ recording }: { recording: VideoRecordingRecord | null }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 18, padding: 18 }}>
      <div style={{ color: "var(--color-text-primary)", fontSize: 16, marginBottom: 12 }}>Recording playback</div>
      <div style={{ minHeight: 180, borderRadius: 14, border: "1px solid var(--color-border)", display: "grid", placeItems: "center", color: "var(--color-text-muted)" }}>
        {recording?.playback_url ? "Playback URL ready" : "Recording not available yet"}
      </div>
      <div style={{ marginTop: 10, color: "var(--color-text-muted)", fontSize: 13 }}>
        Quality score: {recording?.quality_score ?? "pending"}
      </div>
      {recording?.transcript_text ? (
        <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", color: "var(--color-text-muted)", fontSize: 13 }}>{recording.transcript_text}</pre>
      ) : null}
    </div>
  );
}
