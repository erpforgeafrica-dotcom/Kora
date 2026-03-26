import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getClinicalPatients, getClinicalAppointments, getClinicalNotes,
  createClinicalNote, updateClinicalAppointmentStatus,
  type ClinicalPatient, type ClinicalAppointment, type ClinicalNote,
} from "../../services/api";

// ─── shared hook ─────────────────────────────────────────────────────────────
function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fn()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ─── role config ─────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { label: string; color: string; tabs: string[] }> = {
  doctor:       { label: "Doctor",           color: "#3b82f6", tabs: ["Patients","Appointments","Notes","Prescriptions","Lab","Follow-ups"] },
  nurse:        { label: "Nurse",            color: "#10b981", tabs: ["Patients","Appointments","Notes","Vitals","Follow-ups"] },
  pharmacist:   { label: "Pharmacist",       color: "#8b5cf6", tabs: ["Prescriptions","Dispensing","Inventory"] },
  lab_scientist:{ label: "Lab Scientist",    color: "#f59e0b", tabs: ["Lab Requests","Results","Reports"] },
  caregiver:    { label: "Caregiver",        color: "#ec4899", tabs: ["Patients","Care Notes","Follow-ups"] },
  business_admin:{ label: "Admin",           color: "#6b7280", tabs: ["Patients","Appointments","Notes","Compliance"] },
  staff:        { label: "Staff",            color: "#6b7280", tabs: ["Patients","Appointments","Notes"] },
};

// ─── primitives ──────────────────────────────────────────────────────────────
function Pill({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: color ? `color-mix(in srgb, ${color} 14%, transparent)` : "var(--color-accent-dim)",
      color: color ?? "var(--color-accent)",
      border: `1px solid color-mix(in srgb, ${color ?? "var(--color-accent)"} 28%, transparent)`,
      fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em",
    }}>
      {label}
    </span>
  );
}

function Card({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 14, borderRadius: 14,
        border: active
          ? "1px solid color-mix(in srgb, var(--color-accent) 40%, transparent)"
          : "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
        background: active ? "var(--color-accent-dim)" : "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
        cursor: onClick ? "pointer" : "default",
        transition: "all 120ms ease",
      }}
    >
      {children}
    </div>
  );
}

function Btn({ children, onClick, tone = "ghost", disabled }: {
  children: React.ReactNode; onClick?: () => void;
  tone?: "accent" | "ghost" | "danger"; disabled?: boolean;
}) {
  const bg = tone === "accent"
    ? "linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 18%, var(--color-surface) 82%), var(--color-surface-2))"
    : tone === "danger"
    ? "color-mix(in srgb, #ef4444 12%, transparent)"
    : "color-mix(in srgb, var(--color-surface) 82%, transparent)";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
        border: tone === "accent"
          ? "1px solid color-mix(in srgb, var(--color-accent) 36%, transparent)"
          : tone === "danger"
          ? "1px solid color-mix(in srgb, #ef4444 30%, transparent)"
          : "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
        background: bg,
        color: tone === "accent" ? "var(--color-accent)" : tone === "danger" ? "#ef4444" : "var(--color-text-secondary)",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

function Section({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 18,
      border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
      background: "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid color-mix(in srgb, var(--color-border) 60%, transparent)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{title}</span>
        {meta && <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "'DM Mono', monospace" }}>{meta}</span>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

// ─── Patient list panel ───────────────────────────────────────────────────────
function PatientPanel({
  selected, onSelect,
}: {
  selected: ClinicalPatient | null;
  onSelect: (p: ClinicalPatient) => void;
}) {
  const [search, setSearch] = useState("");
  const patients = useApi(() => getClinicalPatients({ search }), [search]);

  return (
    <Section title={`Patients (${patients.data?.count ?? 0})`} meta="Select to open record">
      <input
        placeholder="Search by name or number…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 10, marginBottom: 12,
          border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
          background: "color-mix(in srgb, var(--color-surface) 82%, transparent)",
          color: "var(--color-text-primary)", fontSize: 13,
        }}
      />
      {patients.loading && <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading…</div>}
      {patients.error && <div style={{ color: "#ef4444", fontSize: 13 }}>{patients.error}</div>}
      <div style={{ display: "grid", gap: 8, maxHeight: 520, overflowY: "auto" }}>
        {patients.data?.patients.map((p) => (
          <Card key={p.id} active={selected?.id === p.id} onClick={() => onSelect(p)}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {p.client_name ?? p.patient_number ?? p.id.slice(0, 8)}
            </div>
            <div style={{ marginTop: 4, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {p.allergies?.length > 0 && <Pill label={`⚠ ${p.allergies.length} allergy`} color="#ef4444" />}
              {p.blood_type && <Pill label={p.blood_type} color="#6b7280" />}
              {p.conditions?.slice(0, 1).map((c, i) => <Pill key={i} label={c} color="#6b7280" />)}
            </div>
          </Card>
        ))}
        {!patients.loading && patients.data?.count === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
            No patients found
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Appointment panel ────────────────────────────────────────────────────────
function AppointmentPanel({
  patient, onSelectAppt, selectedAppt,
}: {
  patient: ClinicalPatient;
  onSelectAppt: (a: ClinicalAppointment) => void;
  selectedAppt: ClinicalAppointment | null;
}) {
  const appts = useApi(() => getClinicalAppointments(), []);
  const patientAppts = appts.data?.appointments.filter((a) => a.patient_id === patient.id) ?? [];

  async function handleStatus(id: string, status: string) {
    await updateClinicalAppointmentStatus(id, status);
    appts.reload();
  }

  const STATUS_COLOR: Record<string, string> = {
    scheduled: "#f59e0b", in_progress: "#3b82f6", completed: "#10b981",
    cancelled: "#ef4444", no_show: "#6b7280",
  };

  return (
    <Section title={`Appointments (${patientAppts.length})`} meta="Select to view notes">
      {appts.loading && <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>Loading…</div>}
      <div style={{ display: "grid", gap: 8 }}>
        {patientAppts.map((a) => (
          <Card key={a.id} active={selectedAppt?.id === a.id} onClick={() => onSelectAppt(a)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {a.appointment_type ?? "Appointment"}
                </div>
                {a.chief_complaint && (
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 3 }}>{a.chief_complaint}</div>
                )}
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
                  {new Date(a.created_at).toLocaleDateString()}
                </div>
              </div>
              <Pill label={a.status} color={STATUS_COLOR[a.status] ?? "#6b7280"} />
            </div>
            {selectedAppt?.id === a.id && a.status === "scheduled" && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                <Btn tone="accent" onClick={() => handleStatus(a.id, "in_progress")}>Start</Btn>
                <Btn onClick={() => handleStatus(a.id, "completed")}>Complete</Btn>
                <Btn tone="danger" onClick={() => handleStatus(a.id, "cancelled")}>Cancel</Btn>
              </div>
            )}
          </Card>
        ))}
        {!appts.loading && patientAppts.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
            No appointments on record
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Notes panel ─────────────────────────────────────────────────────────────
function NotesPanel({ appointment }: { appointment: ClinicalAppointment }) {
  const notes = useApi(() => getClinicalNotes(appointment.id), [appointment.id]);
  const [form, setForm] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.subjective.trim()) return;
    setSaving(true);
    try {
      await createClinicalNote(appointment.id, form);
      setForm({ subjective: "", objective: "", assessment: "", plan: "" });
      notes.reload();
    } finally { setSaving(false); }
  }

  return (
    <Section title="Clinical Notes" meta={`${notes.data?.count ?? 0} notes`}>
      <div style={{ display: "grid", gap: 10, marginBottom: 16, maxHeight: 320, overflowY: "auto" }}>
        {notes.data?.notes.map((n) => (
          <div key={n.id} style={{
            padding: 12, borderRadius: 12,
            background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
            border: "1px solid color-mix(in srgb, var(--color-border) 60%, transparent)",
          }}>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 6 }}>
              {n.author_name ?? "Staff"} · {new Date(n.created_at).toLocaleString()}
            </div>
            {n.subjective && <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}><strong>S:</strong> {n.subjective}</div>}
            {n.objective && <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}><strong>O:</strong> {n.objective}</div>}
            {n.assessment && <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}><strong>A:</strong> {n.assessment}</div>}
            {n.plan && <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4 }}><strong>P:</strong> {n.plan}</div>}
          </div>
        ))}
        {!notes.loading && notes.data?.count === 0 && (
          <div style={{ color: "var(--color-text-muted)", fontSize: 13 }}>No notes yet</div>
        )}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {(["subjective", "objective", "assessment", "plan"] as const).map((field) => (
          <div key={field}>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {field === "subjective" ? "S — Subjective *" : field === "objective" ? "O — Objective" : field === "assessment" ? "A — Assessment" : "P — Plan"}
            </div>
            <textarea
              value={form[field]}
              onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
              rows={field === "subjective" ? 3 : 2}
              placeholder={field === "subjective" ? "Patient's chief complaint and history…" : ""}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 10, resize: "vertical",
                border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
                background: "color-mix(in srgb, var(--color-surface) 82%, transparent)",
                color: "var(--color-text-primary)", fontSize: 13,
              }}
            />
          </div>
        ))}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn tone="accent" onClick={handleSave} disabled={saving || !form.subjective.trim()}>
            {saving ? "Saving…" : "Save SOAP Note"}
          </Btn>
          <Btn onClick={() => setForm({ subjective: "", objective: "", assessment: "", plan: "" })}>Clear</Btn>
        </div>
      </div>
    </Section>
  );
}

// ─── Patient detail panel ─────────────────────────────────────────────────────
function PatientDetail({
  patient, role,
}: {
  patient: ClinicalPatient;
  role: string;
}) {
  const [selectedAppt, setSelectedAppt] = useState<ClinicalAppointment | null>(null);
  const navigate = useNavigate();

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Header card */}
      <div style={{
        padding: 18, borderRadius: 18,
        border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
        background: "linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 8%, var(--color-surface) 92%), var(--color-surface-2))",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {patient.client_name ?? "Unknown Patient"}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 4, fontFamily: "'DM Mono', monospace" }}>
              #{patient.patient_number ?? patient.id.slice(0, 8)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {patient.blood_type && <Pill label={`Blood: ${patient.blood_type}`} color="#3b82f6" />}
            {patient.insurance_provider && <Pill label={patient.insurance_provider} color="#6b7280" />}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>Emergency Contact</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {patient.emergency_contact_name ?? "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{patient.emergency_contact_phone ?? ""}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>Allergies</div>
            {patient.allergies?.length > 0
              ? patient.allergies.map((a, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>⚠ {a}</div>
                ))
              : <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>None reported</div>}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>Active Medications</div>
            {patient.current_medications?.length > 0
              ? patient.current_medications.slice(0, 3).map((m, i) => (
                  <div key={i} style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>• {m}</div>
                ))
              : <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>None</div>}
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>Conditions</div>
            {patient.conditions?.length > 0
              ? patient.conditions.slice(0, 3).map((c, i) => (
                  <div key={i} style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>• {c}</div>
                ))
              : <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>None</div>}
          </div>
        </div>

        {/* Role-specific quick actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          {(role === "doctor" || role === "nurse") && (
            <Btn tone="accent" onClick={() => navigate("/app/clinical/appointments")}>New Appointment</Btn>
          )}
          {role === "doctor" && (
            <Btn onClick={() => navigate("/app/clinical/prescriptions")}>Write Prescription</Btn>
          )}
          {role === "doctor" && (
            <Btn onClick={() => navigate("/app/clinical/lab")}>Request Lab</Btn>
          )}
          {role === "pharmacist" && (
            <Btn tone="accent" onClick={() => navigate("/app/clinical/pharmacy")}>Dispense Medication</Btn>
          )}
          {role === "lab_scientist" && (
            <Btn tone="accent" onClick={() => navigate("/app/clinical/lab")}>Process Lab Request</Btn>
          )}
          {role === "caregiver" && (
            <Btn tone="accent" onClick={() => navigate("/app/clinical/followups")}>Schedule Follow-up</Btn>
          )}
        </div>
      </div>

      {/* Appointments */}
      <AppointmentPanel
        patient={patient}
        selectedAppt={selectedAppt}
        onSelectAppt={(a) => setSelectedAppt(selectedAppt?.id === a.id ? null : a)}
      />

      {/* Notes — only when appointment selected */}
      {selectedAppt && <NotesPanel appointment={selectedAppt} />}
    </div>
  );
}

// ─── Role-specific placeholder panels ────────────────────────────────────────
function RolePlaceholder({ role, tab }: { role: string; tab: string }) {
  const messages: Record<string, string> = {
    Prescriptions: "Prescription management — write, review, and track active prescriptions.",
    "Lab Requests": "Lab request queue — create requests, track status, and receive results.",
    "Lab": "Lab workspace — process incoming requests and record results.",
    Results: "Lab results — review completed tests and flag abnormal values.",
    Reports: "Lab reports — generate and export clinical lab summaries.",
    Pharmacy: "Pharmacy dispensing — fulfill prescriptions and manage medication stock.",
    Dispensing: "Dispensing queue — process and confirm medication fulfillment.",
    Inventory: "Pharmacy inventory — track stock levels and reorder thresholds.",
    "Follow-ups": "Follow-up scheduler — assign and track post-care follow-up tasks.",
    Vitals: "Vitals recording — log and trend patient vital signs.",
    Compliance: "Clinical compliance — audit patient records and appointment coverage.",
  };

  return (
    <div style={{
      padding: 48, textAlign: "center", borderRadius: 18,
      border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
      background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🏥</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>{tab}</div>
      <div style={{ fontSize: 14, color: "var(--color-text-muted)", maxWidth: 400, margin: "0 auto" }}>
        {messages[tab] ?? `${tab} workspace for ${role}.`}
      </div>
      <div style={{ marginTop: 16, fontSize: 12, color: "var(--color-text-muted)", fontFamily: "'DM Mono', monospace" }}>
        BACKEND WIRED · UI IN PROGRESS
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function ClinicalModule() {
  const { userRole } = useAuthContext();
  const role = (userRole as string) ?? "staff";
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.staff;
  const [activeTab, setActiveTab] = useState(cfg.tabs[0]);
  const [selectedPatient, setSelectedPatient] = useState<ClinicalPatient | null>(null);

  // Reset tab when role changes
  useEffect(() => {
    const newCfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.staff;
    setActiveTab(newCfg.tabs[0]);
  }, [role]);

  const patientTabs = ["Patients", "Appointments", "Notes", "Vitals", "Follow-ups", "Care Notes"];
  const showPatientPanel = patientTabs.includes(activeTab);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Header */}
      <div style={{
        padding: 24, borderRadius: 24,
        border: `1px solid color-mix(in srgb, ${cfg.color} 28%, transparent)`,
        background: `linear-gradient(135deg, color-mix(in srgb, ${cfg.color} 8%, var(--color-surface) 92%), var(--color-surface-2))`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", color: cfg.color, fontWeight: 700, textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              Clinical & Care
            </div>
            <h1 style={{ margin: "8px 0 0", fontSize: 32, color: "var(--color-text-primary)" }}>
              Clinical Workspace
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--color-text-secondary)" }}>
              {cfg.label} view — patient records, appointments, and care workflows.
            </p>
          </div>
          <Pill label={cfg.label} color={cfg.color} />
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
          {cfg.tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: activeTab === tab
                  ? `1px solid color-mix(in srgb, ${cfg.color} 40%, transparent)`
                  : "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
                background: activeTab === tab
                  ? `color-mix(in srgb, ${cfg.color} 14%, transparent)`
                  : "color-mix(in srgb, var(--color-surface) 82%, transparent)",
                color: activeTab === tab ? cfg.color : "var(--color-text-muted)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {showPatientPanel ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.5fr)", gap: 16 }}>
          <PatientPanel selected={selectedPatient} onSelect={setSelectedPatient} />
          <div>
            {selectedPatient
              ? <PatientDetail patient={selectedPatient} role={role} />
              : (
                <div style={{
                  padding: 64, textAlign: "center", borderRadius: 18,
                  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
                  background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>👤</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>No patient selected</div>
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 8 }}>
                    Select a patient from the list to view their record.
                  </div>
                </div>
              )}
          </div>
        </div>
      ) : (
        <RolePlaceholder role={role} tab={activeTab} />
      )}
    </div>
  );
}
