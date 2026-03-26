import { useEffect, useMemo, useState } from "react";
import { addBookingNote, getClientBrief, getTodaySchedule, updateAppointmentStatus } from "../../services/api";
import type { ClientBrief, TodaysSchedule } from "../../types/audience";
import { ActionButton, AudienceMetric, AudienceSection, EmptyState, StatusPill, formatCompactDate } from "../../components/audience/AudiencePrimitives";

const MOCK_SCHEDULE: TodaysSchedule[] = [
  {
    appointment_id: "appt-1",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    room: "Room 2",
    status: "confirmed",
    client: { id: "client-1", name: "Sarah Bloom", phone: "+44 7000 000000", photo_url: null, preferences: { lighting: "Dim" } },
    service: { name: "Recovery Blend", duration_minutes: 60, notes: "Focus lower back" }
  },
  {
    appointment_id: "appt-2",
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    room: "Room 4",
    status: "checked_in",
    client: { id: "client-2", name: "Daniel Ross", phone: "+44 7111 111111", photo_url: null, preferences: { pressure: "Firm" } },
    service: { name: "Sports Massage", duration_minutes: 60, notes: null }
  }
];

const MOCK_BRIEF: ClientBrief = {
  client_name: "Sarah Bloom",
  brief_summary: "Fourth visit. Prefers low-light setup, warm-up work before deeper pressure, and a direct handoff after completion.",
  last_service: "Recovery Blend",
  preferences: ["Dim lighting", "Warm towel finish", "No strong fragrances"],
  contraindications: [],
  suggested_upsells: ["Add deep conditioner", "Offer mobility reset follow-up"]
};

export function StaffWorkspacePage() {
  const [schedule, setSchedule] = useState<TodaysSchedule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [brief, setBrief] = useState<ClientBrief | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [briefState, setBriefState] = useState<"idle" | "loading" | "loaded" | "empty">("idle");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const response = await getTodaySchedule();
        setSchedule(response);
        setSelectedId(response[0]?.appointment_id ?? null);
        setError(null);
      } catch (err) {
        setSchedule(MOCK_SCHEDULE);
        setSelectedId(MOCK_SCHEDULE[0]?.appointment_id ?? null);
        setError(err instanceof Error ? err.message : "Staff workspace is currently using preview data.");
      }
    }

    void loadSchedule();
  }, []);

  useEffect(() => {
    async function loadBrief() {
      if (!selectedId) {
        setBrief(null);
        setBriefState("idle");
        return;
      }

      setBriefState("loading");
      try {
        const response = await getClientBrief(selectedId);
        setBrief(response);
        setBriefState(response.brief_summary ? "loaded" : "empty");
      } catch {
        setBrief(MOCK_BRIEF);
        setBriefState("loaded");
      }
    }

    void loadBrief();
  }, [selectedId]);

  const selectedAppointment = useMemo(
    () => schedule.find((item) => item.appointment_id === selectedId) ?? null,
    [schedule, selectedId]
  );

  const metrics = useMemo(() => {
    const confirmed = schedule.filter((item) => item.status === "confirmed").length;
    const active = schedule.filter((item) => item.status === "in_progress" || item.status === "checked_in").length;
    const completed = schedule.filter((item) => item.status === "completed").length;

    return [
      { label: "My Schedule", value: String(schedule.length), tone: "var(--color-accent)" },
      { label: "Assigned Bookings", value: String(confirmed), tone: "var(--color-text-primary)" },
      { label: "Service Execution", value: String(active), tone: "var(--color-warning)" },
      { label: "Shift Tools", value: String(completed), tone: "var(--color-success)" }
    ];
  }, [schedule]);

  async function handleStatusChange(status: "checked_in" | "in_progress" | "completed" | "no_show") {
    if (!selectedAppointment) return;

    const appointmentId = selectedAppointment.appointment_id;
    const previous = schedule;
    setSchedule((current) =>
      current.map((item) => (item.appointment_id === appointmentId ? { ...item, status } : item))
    );

    try {
      await updateAppointmentStatus(appointmentId, status);
    } catch {
      setSchedule(previous);
    }
  }

  async function handleSaveNote() {
    if (!selectedAppointment || !note.trim()) return;

    setSavingNote(true);
    try {
      await addBookingNote(selectedAppointment.appointment_id, note.trim());
      setNote("");
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {error ? (
        <div style={{ padding: 14, borderRadius: 14, background: "color-mix(in srgb, var(--color-warning) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-warning) 28%, transparent)", color: "var(--color-warning)" }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {metrics.map((metric) => (
          <AudienceMetric key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(340px, 0.85fr)", gap: 16 }}>
        <AudienceSection title="My Schedule" meta="Today">
          <div style={{ display: "grid", gap: 10 }}>
            {schedule.length ? (
              schedule.map((appointment) => (
                <button
                  key={appointment.appointment_id}
                  type="button"
                  onClick={() => setSelectedId(appointment.appointment_id)}
                  style={{
                    textAlign: "left",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: appointment.appointment_id === selectedId ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                    background: appointment.appointment_id === selectedId ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>{appointment.client.name ?? "Walk-in client"}</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: "var(--color-text-muted)" }}>
                        {appointment.service.name} · {formatCompactDate(appointment.start_time)} · {appointment.room ?? "Room pending"}
                      </div>
                    </div>
                    <StatusPill
                      label={appointment.status.replace("_", " ")}
                      tone={appointment.status === "completed" ? "success" : appointment.status === "no_show" ? "danger" : appointment.status === "checked_in" || appointment.status === "in_progress" ? "warning" : "accent"}
                    />
                  </div>
                </button>
              ))
            ) : (
              <EmptyState title="Clear day ahead" detail="No appointments are currently scheduled." />
            )}
          </div>
        </AudienceSection>

        <AudienceSection title="Customer Details" meta="Selected appointment">
          {selectedAppointment ? (
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>{selectedAppointment.client.name ?? "Walk-in client"}</div>
                <div style={{ marginTop: 4, fontSize: 14, color: "var(--color-text-muted)" }}>
                  {selectedAppointment.service.name} · {selectedAppointment.client.phone ?? "No phone provided"}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(selectedAppointment.client.preferences ?? {}).map(([key, value]) => (
                  <StatusPill key={key} label={`${key}: ${String(value)}`} tone="muted" />
                ))}
              </div>
              {briefState === "loading" ? (
                <div style={{ color: "var(--color-text-muted)", fontSize: 14 }}>Loading client brief...</div>
              ) : briefState === "empty" ? (
                <EmptyState title="No brief available" detail="Check back closer to the appointment for an AI-generated brief." />
              ) : brief ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)", fontSize: 14, lineHeight: 1.7, color: "var(--color-text-secondary)" }}>
                    {brief.brief_summary}
                  </div>
                  {brief.contraindications.length ? (
                    <div style={{ padding: 14, borderRadius: 14, background: "color-mix(in srgb, var(--color-warning) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-warning) 24%, transparent)", color: "var(--color-warning)" }}>
                      {brief.contraindications.join(" · ")}
                    </div>
                  ) : null}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {brief.preferences.map((item) => <StatusPill key={item} label={item} tone="accent" />)}
                  </div>
                </div>
              ) : (
                <EmptyState title="Select an appointment" detail="Choose a booking from your schedule to load the client brief." />
              )}
            </div>
          ) : (
            <EmptyState title="Select an appointment" detail="Choose a booking from your schedule to see customer details." />
          )}
        </AudienceSection>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 }}>
        <AudienceSection title="Service Execution" meta="Status controls">
          {selectedAppointment ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <ActionButton onClick={() => void handleStatusChange("checked_in")} disabled={selectedAppointment.status !== "confirmed"}>
                Check In
              </ActionButton>
              <ActionButton onClick={() => void handleStatusChange("in_progress")} disabled={selectedAppointment.status !== "checked_in"}>
                Start Service
              </ActionButton>
              <ActionButton onClick={() => void handleStatusChange("completed")} disabled={selectedAppointment.status !== "in_progress"} tone="warning">
                Complete
              </ActionButton>
              <ActionButton onClick={() => void handleStatusChange("no_show")} tone="ghost">
                No Show
              </ActionButton>
            </div>
          ) : (
            <EmptyState title="No service selected" detail="Choose an appointment to unlock execution controls." />
          )}
        </AudienceSection>

        <AudienceSection title="Shift Tools" meta="Session note capture">
          {selectedAppointment ? (
            <div style={{ display: "grid", gap: 12 }}>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={6}
                placeholder="Add treatment notes, handoff details, or follow-up instructions."
                style={{
                  width: "100%",
                  resize: "vertical",
                  borderRadius: 14,
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface-2)",
                  color: "var(--color-text-primary)",
                  padding: 14,
                  font: "inherit"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                  This workspace remains staff-focused. Operations monitoring now lives in its own dashboard.
                </div>
                <ActionButton onClick={() => void handleSaveNote()} disabled={savingNote || !note.trim()}>
                  {savingNote ? "Saving..." : "Save Note"}
                </ActionButton>
              </div>
            </div>
          ) : (
            <EmptyState title="No booking selected" detail="Choose an appointment before capturing treatment notes or shift actions." />
          )}
        </AudienceSection>
      </div>
    </div>
  );
}
