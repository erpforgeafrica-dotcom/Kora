import { useState, useEffect, useCallback } from "react";
import { ActionButton, AudienceSection, StatusPill, EmptyState } from "../../components/audience/AudiencePrimitives";
import {
  getEmergencyRequests, getDispatchUnits, getActiveIncidentsSummary,
  createEmergencyRequest, updateEmergencyStatus, assignDispatchUnit,
  type EmergencyRequest, type DispatchUnit,
} from "../../services/api";
import { useAuthContext } from "../../contexts/AuthContext";

function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fn()); } catch (e: any) { setError(e.message ?? "Failed"); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

const SEV: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  critical: { bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)",  text: "#ef4444", icon: "🔴" },
  high:     { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", text: "#f59e0b", icon: "🟠" },
  medium:   { bg: "rgba(245,180,47,0.1)", border: "rgba(245,180,47,0.3)", text: "#f5b42f", icon: "🟡" },
  low:      { bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.3)",  text: "#22c55e", icon: "🟢" },
};

const REQUESTER_TYPES = [
  "medical_emergency", "fire", "security_threat", "accident",
  "mental_health_crisis", "domestic_incident", "utility_failure", "other",
];

const STATUS_FLOW: Record<string, string[]> = {
  open:       ["dispatched", "cancelled"],
  dispatched: ["en_route", "cancelled"],
  en_route:   ["on_scene", "cancelled"],
  on_scene:   ["resolved", "cancelled"],
  resolved:   [],
  cancelled:  [],
};

// ─── Requester panel (client / staff submitting a request) ───────────────────
function RequesterPanel({ onSubmitted }: { onSubmitted: () => void }) {
  const [form, setForm] = useState({
    request_type: "", severity: "high" as "critical"|"high"|"medium"|"low",
    address: "", caller_name: "", caller_phone: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!form.request_type) return;
    setSubmitting(true);
    try {
      await createEmergencyRequest(form);
      setDone(true);
      onSubmitted();
    } finally { setSubmitting(false); }
  }

  if (done) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
          Request submitted
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
          Your emergency request has been received. A dispatcher will respond shortly.
        </div>
        <ActionButton tone="ghost" onClick={() => { setDone(false); setForm({ request_type: "", severity: "high", address: "", caller_name: "", caller_phone: "", notes: "" }); }}>
          Submit another
        </ActionButton>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 20, maxWidth: 560 }}>
      <div style={{ padding: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#ef4444", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
          🚨 Emergency Request
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          Fill in the details below. All fields marked * are required.
        </div>
      </div>

      <AudienceSection title="Incident details" meta="What is happening?">
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={labelStyle}>Incident type *</div>
            <select value={form.request_type} onChange={e => setForm(p => ({ ...p, request_type: e.target.value }))} style={inputStyle}>
              <option value="">Select type…</option>
              {REQUESTER_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <div style={labelStyle}>Severity *</div>
            <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value as any }))} style={inputStyle}>
              {["critical", "high", "medium", "low"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={labelStyle}>Location / Address *</div>
            <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address or landmark" style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>Additional notes</div>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Describe the situation in detail…" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
        </div>
      </AudienceSection>

      <AudienceSection title="Your contact details" meta="So dispatch can reach you">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={labelStyle}>Your name</div>
            <input value={form.caller_name} onChange={e => setForm(p => ({ ...p, caller_name: e.target.value }))} placeholder="Full name" style={inputStyle} />
          </div>
          <div>
            <div style={labelStyle}>Phone number</div>
            <input value={form.caller_phone} onChange={e => setForm(p => ({ ...p, caller_phone: e.target.value }))} placeholder="+44 …" style={inputStyle} />
          </div>
        </div>
      </AudienceSection>

      <div style={{ display: "flex", gap: 10 }}>
        <ActionButton tone="accent" onClick={submit} disabled={submitting || !form.request_type || !form.address}>
          {submitting ? "Submitting…" : "🚨 Submit Emergency Request"}
        </ActionButton>
      </div>
    </div>
  );
}

// ─── Dispatcher / Admin panel ────────────────────────────────────────────────
function DispatcherPanel() {
  const [statusFilter, setStatusFilter] = useState("open");
  const [selected, setSelected] = useState<EmergencyRequest | null>(null);
  const [assigningUnit, setAssigningUnit] = useState<string | null>(null);

  const summary = useApi(() => getActiveIncidentsSummary(), []);
  const requests = useApi(() => getEmergencyRequests(statusFilter || undefined), [statusFilter]);
  const units = useApi(() => getDispatchUnits(), []);

  const availableUnits = units.data?.units.filter((u: DispatchUnit) => u.status === "available") ?? [];
  const s = summary.data;

  async function handleStatusChange(id: string, status: string) {
    await updateEmergencyStatus(id, status);
    requests.reload(); summary.reload();
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  async function handleAssign(requestId: string, unitId: string) {
    setAssigningUnit(unitId);
    try { await assignDispatchUnit(requestId, unitId); requests.reload(); units.reload(); summary.reload(); }
    finally { setAssigningUnit(null); }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Active",      value: s?.active_count ?? "—",     color: "#f59e0b" },
          { label: "Critical",    value: s?.critical_count ?? "—",   color: "#ef4444" },
          { label: "High",        value: s?.high_count ?? "—",       color: "#f97316" },
          { label: "Unassigned",  value: s?.unassigned_count ?? "—", color: "#6b7280" },
        ].map(k => (
          <div key={k.label} style={{ padding: 14, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Status filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["open", "dispatched", "en_route", "on_scene", "resolved", ""] as const).map(f => (
          <button key={f || "all"} onClick={() => setStatusFilter(f)} style={{
            padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: statusFilter === f ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
            background: statusFilter === f ? "var(--color-accent-dim)" : "transparent",
            color: statusFilter === f ? "var(--color-accent)" : "var(--color-text-muted)",
          }}>
            {f || "All"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: 16 }}>
        {/* Request list */}
        <AudienceSection title={`Requests (${requests.data?.count ?? 0})`} meta="Select to manage">
          {requests.loading && <div style={{ padding: 16, color: "var(--color-text-muted)" }}>Loading…</div>}
          {requests.error && <div style={{ padding: 16, color: "var(--color-danger)" }}>{requests.error}</div>}
          <div style={{ display: "grid", gap: 8, maxHeight: 560, overflowY: "auto" }}>
            {requests.data?.requests.map((r: EmergencyRequest) => {
              const sty = SEV[r.severity] ?? SEV.medium;
              return (
                <button key={r.id} onClick={() => setSelected(selected?.id === r.id ? null : r)} style={{
                  padding: 12, borderRadius: 10, textAlign: "left", cursor: "pointer",
                  border: selected?.id === r.id ? `1px solid ${sty.text}` : "1px solid var(--color-border)",
                  background: selected?.id === r.id ? sty.bg : "var(--color-surface-2)",
                }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{sty.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: sty.text, textTransform: "uppercase" }}>{r.severity}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 2 }}>{r.request_type.replace(/_/g, " ")}</div>
                      {r.address && <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>{r.address}</div>}
                      <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 4 }}>{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                    <StatusPill label={r.status} tone={r.status === "resolved" ? "success" : r.status === "open" ? "danger" : "warning"} />
                  </div>
                </button>
              );
            })}
            {!requests.loading && requests.data?.count === 0 && (
              <EmptyState title="No requests" detail={`No ${statusFilter || ""} emergency requests.`} />
            )}
          </div>
        </AudienceSection>

        {/* Detail + actions */}
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          {selected ? (
            <>
              <AudienceSection title={selected.request_type.replace(/_/g, " ")} meta={`ID: ${selected.id.slice(0, 8)}`}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Severity",      value: selected.severity },
                    { label: "Status",        value: selected.status },
                    { label: "Caller",        value: selected.caller_name ?? "—" },
                    { label: "Phone",         value: selected.caller_phone ?? "—" },
                    { label: "Address",       value: selected.address ?? "—" },
                    { label: "Assigned Unit", value: (selected as any).assigned_unit_name ?? "Unassigned" },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 2 }}>{f.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{f.value}</div>
                    </div>
                  ))}
                </div>
                {selected.notes && (
                  <div style={{ marginTop: 12, padding: 10, background: "var(--color-surface-2)", borderRadius: 8, fontSize: 12, color: "var(--color-text-secondary)" }}>
                    {selected.notes}
                  </div>
                )}
              </AudienceSection>

              {/* Workflow actions */}
              {STATUS_FLOW[selected.status]?.length > 0 && (
                <AudienceSection title="Workflow actions" meta="Advance incident status">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {STATUS_FLOW[selected.status].map(s => (
                      <ActionButton key={s} tone={s === "resolved" ? "accent" : s === "cancelled" ? "ghost" : "ghost"}
                        onClick={() => handleStatusChange(selected.id, s)}>
                        → {s.replace(/_/g, " ")}
                      </ActionButton>
                    ))}
                  </div>
                </AudienceSection>
              )}

              {/* Assign unit */}
              {selected.status === "open" && (
                <AudienceSection title="Assign dispatch unit" meta={`${availableUnits.length} available`}>
                  {availableUnits.length === 0
                    ? <EmptyState title="No units available" detail="All dispatch units are currently engaged." />
                    : (
                      <div style={{ display: "grid", gap: 8 }}>
                        {availableUnits.map((u: DispatchUnit) => (
                          <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 10, background: "var(--color-surface-2)", borderRadius: 8 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{u.unit_name}</div>
                              <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{u.unit_type ?? "Unit"} · {u.staff_name ?? "No staff"}</div>
                            </div>
                            <ActionButton tone="accent" onClick={() => handleAssign(selected.id, u.id)} disabled={assigningUnit === u.id}>
                              {assigningUnit === u.id ? "Assigning…" : "Dispatch"}
                            </ActionButton>
                          </div>
                        ))}
                      </div>
                    )}
                </AudienceSection>
              )}

              {/* All units overview */}
              <AudienceSection title="All units" meta={`${units.data?.count ?? 0} total`}>
                {units.loading
                  ? <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Loading…</div>
                  : units.data?.units.map((u: DispatchUnit) => (
                    <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{u.unit_name}</div>
                        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{u.staff_name ?? "—"}</div>
                      </div>
                      <StatusPill label={u.status} tone={u.status === "available" ? "success" : "warning"} />
                    </div>
                  ))}
              </AudienceSection>
            </>
          ) : (
            <AudienceSection title="No request selected" meta="Select from the list">
              <div style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}>
                Select an emergency request to view details, advance status, and assign a dispatch unit.
              </div>
            </AudienceSection>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
const DISPATCHER_ROLES = ["business_admin", "platform_admin", "operations", "dispatcher"];

export function EmergencyModule() {
  const { userRole } = useAuthContext();
  const isDispatcher = DISPATCHER_ROLES.includes(userRole ?? "");
  const [view, setView] = useState<"dispatch" | "request">(isDispatcher ? "dispatch" : "request");
  const requests = useApi(() => getEmergencyRequests("open"), []);

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ padding: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#ef4444", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
            🚨 Emergency & Dispatch
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {view === "dispatch" ? "Live Incident Management" : "Submit Emergency Request"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {isDispatcher && (
            <button onClick={() => setView("dispatch")} style={{
              padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: view === "dispatch" ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
              background: view === "dispatch" ? "var(--color-accent-dim)" : "transparent",
              color: view === "dispatch" ? "var(--color-accent)" : "var(--color-text-muted)",
            }}>
              Dispatch Board
            </button>
          )}
          <button onClick={() => setView("request")} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: view === "request" ? "1px solid #ef4444" : "1px solid var(--color-border)",
            background: view === "request" ? "rgba(239,68,68,0.1)" : "transparent",
            color: view === "request" ? "#ef4444" : "var(--color-text-muted)",
          }}>
            + New Request
          </button>
        </div>
      </div>

      {view === "request" && <RequesterPanel onSubmitted={() => { requests.reload(); if (isDispatcher) setView("dispatch"); }} />}
      {view === "dispatch" && <DispatcherPanel />}
    </div>
  );
}

const labelStyle = { fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 } as const;
const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 6,
  border: "1px solid var(--color-border)", background: "var(--color-surface-1)",
  color: "var(--color-text-primary)", fontSize: 13,
} as const;
