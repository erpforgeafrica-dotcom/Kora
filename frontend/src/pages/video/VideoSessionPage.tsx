import { useState, useEffect } from "react";
import { createVideoSession, getVideoSession } from "../../services/api";
import type { VideoSessionRecord } from "../../services/api";

export function VideoSessionPage() {
  const [sessions, setSessions] = useState<VideoSessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ booking_id: "", provider: "daily.co", starts_at: "" });
  const [creating, setCreating] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [endNotes, setEndNotes] = useState("");

  const orgId = localStorage.getItem("kora_org_id") ?? import.meta.env.VITE_ORG_ID ?? "org_placeholder";
  const token = localStorage.getItem("kora_token") ?? import.meta.env.VITE_DEV_BEARER_TOKEN ?? "";
  const base = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Org-Id": orgId,
    "X-Organization-Id": orgId,
  };

  const loadSessions = async () => {
    try {
      const res = await fetch(`${base}/api/video/sessions`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : data.sessions ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const session = await createVideoSession({
        booking_id: form.booking_id || null,
        provider: form.provider || null,
        starts_at: form.starts_at || null,
      });
      setSessions((prev) => [session, ...prev]);
      setShowCreate(false);
      setForm({ booking_id: "", provider: "daily.co", starts_at: "" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (session: VideoSessionRecord) => {
    try {
      await fetch(`${base}/api/video/sessions/${session.id}/join`, { method: "POST", headers });
      const url = session.join_url ?? session.host_token;
      if (url) window.open(url, "_blank");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to join session");
    }
  };

  const handleEnd = async (sessionId: string) => {
    try {
      await fetch(`${base}/api/video/sessions/${sessionId}/end`, {
        method: "POST",
        headers,
        body: JSON.stringify({ notes: endNotes }),
      });
      setEndingId(null);
      setEndNotes("");
      loadSessions();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to end session");
    }
  };

  const statusColor = (s: string) =>
    s === "in_progress" ? "var(--color-warning)" : s === "completed" ? "var(--color-success)" : s === "cancelled" ? "var(--color-danger)" : "var(--color-accent)";

  if (loading) return <div style={{ padding: 24, color: "var(--color-text-muted)" }}>Loading sessions...</div>;

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>Telemedicine</div>
          <h1 style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>Video Consultations</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ padding: "10px 20px", background: "var(--color-accent)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}
        >
          + New Session
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, borderRadius: 8, background: "color-mix(in srgb, var(--color-danger) 10%, transparent)", color: "var(--color-danger)", fontSize: 13 }}>
          {error}
        </div>
      )}

      {showCreate && (
        <div style={{ padding: 20, background: "var(--color-surface-2)", borderRadius: 12, border: "1px solid var(--color-border)", display: "grid", gap: 12, maxWidth: 480 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>Create Video Session</div>
          {[
            { label: "Booking ID (optional)", key: "booking_id", type: "text", placeholder: "uuid" },
            { label: "Provider", key: "provider", type: "text", placeholder: "daily.co" },
            { label: "Starts At", key: "starts_at", type: "datetime-local", placeholder: "" },
          ].map(({ label, key, type, placeholder }) => (
            <label key={key} style={{ display: "grid", gap: 4 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{label}</span>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)", fontSize: 13 }}
              />
            </label>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCreate} disabled={creating} style={{ padding: "9px 18px", background: "var(--color-accent)", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
              {creating ? "Creating..." : "Create"}
            </button>
            <button onClick={() => setShowCreate(false)} style={{ padding: "9px 18px", background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: 6, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {sessions.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>No sessions found. Create one to get started.</div>
        ) : sessions.map((session) => (
          <div key={session.id} style={{ padding: 20, background: "var(--color-surface-2)", borderRadius: 12, border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 4 }}>
                  {session.starts_at ? new Date(session.starts_at).toLocaleString() : "No start time"} · {session.provider ?? "—"}
                </div>
                <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                  Session: {session.id.slice(0, 12)}… · Room: {session.room_name ?? "—"}
                  {session.booking_id && ` · Booking: ${session.booking_id.slice(0, 8)}…`}
                </div>
              </div>
              <span style={{ padding: "4px 10px", borderRadius: 6, background: `color-mix(in srgb, ${statusColor(session.status)} 15%, transparent)`, color: statusColor(session.status), fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                {session.status}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {session.status === "scheduled" && (
                <button onClick={() => handleJoin(session)} style={{ padding: "7px 14px", background: "var(--color-accent)", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  Join Meeting
                </button>
              )}
              {session.status === "in_progress" && endingId !== session.id && (
                <button onClick={() => setEndingId(session.id)} style={{ padding: "7px 14px", background: "var(--color-danger)", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  End Session
                </button>
              )}
            </div>

            {endingId === session.id && (
              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                <textarea
                  placeholder="Session notes (optional)"
                  value={endNotes}
                  onChange={(e) => setEndNotes(e.target.value)}
                  rows={3}
                  style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-surface)", color: "var(--color-text-primary)", fontSize: 13, resize: "vertical" }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleEnd(session.id)} style={{ padding: "7px 14px", background: "var(--color-danger)", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                    Confirm End
                  </button>
                  <button onClick={() => { setEndingId(null); setEndNotes(""); }} style={{ padding: "7px 14px", background: "transparent", color: "var(--color-text-muted)", border: "1px solid var(--color-border)", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
