import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { addMinutes, format, parseISO, set } from "date-fns";
import {
  createAppointment,
  getOrganizationServices,
  getStaffRoster,
  updateAppointment,
  type CalendarAppointment
} from "../../services/api";
import type { StaffMember } from "../../types/audience";
import { useCalendarData } from "../../hooks/useCalendarData";
import { useCalendarStore } from "../../stores/useCalendarStore";
import {
  calculateDuration,
  generateTimeSlots,
  getAppointmentHeight,
  getPixelPosition,
  timeStringToMinutes
} from "../booking/calendarEngine";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const SLOT_INTERVAL_MINUTES = 15;
const PIXELS_PER_MINUTE = 1.5;
const SLOT_HEIGHT = SLOT_INTERVAL_MINUTES * PIXELS_PER_MINUTE;
const GRID_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * 60 * PIXELS_PER_MINUTE;

type BookingStatus = CalendarAppointment["status"];

const STATUS_STYLES: Record<BookingStatus, { background: string; border: string; color: string }> = {
  confirmed: { background: "rgba(0, 229, 200, 0.18)", border: "rgba(0, 229, 200, 0.5)", color: "#8ff7ea" },
  checked_in: { background: "rgba(74, 158, 255, 0.18)", border: "rgba(74, 158, 255, 0.5)", color: "#bfd8ff" },
  in_progress: { background: "rgba(255, 138, 101, 0.2)", border: "rgba(255, 138, 101, 0.55)", color: "#ffd2c2" },
  completed: { background: "rgba(34, 197, 94, 0.18)", border: "rgba(34, 197, 94, 0.5)", color: "#baf3cf" },
  no_show: { background: "rgba(239, 68, 68, 0.18)", border: "rgba(239, 68, 68, 0.5)", color: "#fecaca" }
};

interface DraftSelection {
  staffId: string;
  startMinutes: number;
  endMinutes: number;
}

interface StaffColumnDropData {
  type: "staff-slot";
  staffId: string;
}

function clampMinute(minute: number) {
  return Math.max(DAY_START_HOUR * 60, Math.min(DAY_END_HOUR * 60, minute));
}

function minuteToIso(dateKey: string, minute: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const hours = Math.floor(minute / 60);
  const mins = minute % 60;
  return set(new Date(), {
    year,
    month: month - 1,
    date: day,
    hours,
    minutes: mins,
    seconds: 0,
    milliseconds: 0
  }).toISOString();
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AppointmentCard({
  appointment,
  top,
  height,
  isSelected,
  onSelect,
  onResize
}: {
  appointment: CalendarAppointment;
  top: number;
  height: number;
  isSelected: boolean;
  onSelect: () => void;
  onResize: (appointment: CalendarAppointment, nextEnd: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: appointment.id,
    data: { type: "appointment", appointmentId: appointment.id }
  });

  const style = STATUS_STYLES[appointment.status];

  const handleResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const startY = event.clientY;
    const initialHeight = height;
    const minHeight = getAppointmentHeight(15, PIXELS_PER_MINUTE);

    const onMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientY - startY;
      const nextHeight = Math.max(minHeight, initialHeight + delta);
      const snappedDuration = Math.max(15, Math.round(nextHeight / PIXELS_PER_MINUTE / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES);
      const nextEnd = addMinutes(parseISO(appointment.start_time), snappedDuration).toISOString();
      onResize(appointment, nextEnd);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      style={{
        position: "absolute",
        top,
        left: 8,
        right: 8,
        height,
        background: style.background,
        border: `1px solid ${style.border}`,
        borderRadius: 14,
        padding: "10px 12px 16px",
        boxShadow: isSelected ? "0 0 0 1px rgba(255,255,255,0.18), 0 12px 28px rgba(0,0,0,0.28)" : "0 10px 24px rgba(0,0,0,0.18)",
        color: style.color,
        cursor: "grab",
        opacity: isDragging ? 0.45 : 1,
        overflow: "hidden",
        zIndex: isSelected ? 6 : 4
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", lineHeight: 1.2 }}>{appointment.client_name ?? "Walk-in client"}</div>
      <div style={{ fontSize: 12, marginTop: 4, color: style.color }}>{appointment.service_name ?? "Service pending"}</div>
      <div style={{ fontSize: 11, marginTop: 6, color: "rgba(226,232,240,0.82)" }}>
        {format(parseISO(appointment.start_time), "HH:mm")} - {format(parseISO(appointment.end_time), "HH:mm")} · {calculateDuration(appointment.start_time, appointment.end_time)} min
      </div>
      <div
        onPointerDown={handleResizeStart}
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          bottom: 4,
          height: 8,
          borderRadius: 999,
          background: "rgba(255,255,255,0.22)",
          cursor: "ns-resize"
        }}
      />
    </div>
  );
}

function StaffGridColumn({
  staff,
  appointments,
  selectedAppointmentId,
  onSelectAppointment,
  onOpenDraft,
  onResizeAppointment
}: {
  staff: StaffMember;
  appointments: CalendarAppointment[];
  selectedAppointmentId: string | null;
  onSelectAppointment: (appointmentId: string) => void;
  onOpenDraft: (draft: DraftSelection) => void;
  onResizeAppointment: (appointment: CalendarAppointment, nextEnd: string) => void;
}) {
  const [selection, setSelection] = useState<DraftSelection | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${staff.id}`,
    data: { type: "staff-slot", staffId: staff.id } satisfies StaffColumnDropData
  });

  const getMinuteFromPointer = (clientY: number, currentTarget: HTMLDivElement) => {
    const rect = currentTarget.getBoundingClientRect();
    const relativeY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const minuteFromGrid = Math.round(relativeY / PIXELS_PER_MINUTE / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
    return clampMinute(DAY_START_HOUR * 60 + minuteFromGrid);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-appointment-card='true']")) {
      return;
    }
    const startMinutes = getMinuteFromPointer(event.clientY, event.currentTarget);
    let liveSelection: DraftSelection = { staffId: staff.id, startMinutes, endMinutes: startMinutes + 30 };
    setSelection(liveSelection);

    const onMove = (moveEvent: PointerEvent) => {
      const endMinutes = getMinuteFromPointer(moveEvent.clientY, event.currentTarget);
      liveSelection = {
        staffId: staff.id,
        startMinutes,
        endMinutes: Math.max(startMinutes + 15, endMinutes)
      };
      setSelection(liveSelection);
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      onOpenDraft({
        staffId: staff.id,
        startMinutes: Math.min(liveSelection.startMinutes, liveSelection.endMinutes),
        endMinutes: Math.max(liveSelection.startMinutes, liveSelection.endMinutes)
      });
      setSelection(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div style={{ minWidth: 220, flex: 1 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 8,
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(10,14,24,0.96)",
          backdropFilter: "blur(14px)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "rgba(0,229,200,0.16)",
              border: "1px solid rgba(0,229,200,0.32)",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#8ff7ea"
            }}
          >
            {initials(staff.full_name)}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{staff.full_name}</div>
            <div style={{ fontSize: 11, color: "rgba(148,163,184,0.85)" }}>{staff.role}</div>
          </div>
        </div>
      </div>

      <div
        ref={setNodeRef}
        onPointerDown={handlePointerDown}
        style={{
          position: "relative",
          height: GRID_HEIGHT,
          borderRight: "1px solid rgba(255,255,255,0.06)",
          background: isOver ? "rgba(0,229,200,0.05)" : "transparent"
        }}
      >
        {generateTimeSlots(DAY_START_HOUR, DAY_END_HOUR - 1, SLOT_INTERVAL_MINUTES).map((slot) => (
          <div
            key={`${staff.id}-${slot.formatted}`}
            style={{
              position: "absolute",
              top: getPixelPosition(slot.time - DAY_START_HOUR * 60, PIXELS_PER_MINUTE),
              left: 0,
              right: 0,
              height: SLOT_HEIGHT,
              borderBottom: "1px solid rgba(255,255,255,0.05)"
            }}
          />
        ))}

        {selection && selection.staffId === staff.id ? (
          <div
            style={{
              position: "absolute",
              top: getPixelPosition(Math.min(selection.startMinutes, selection.endMinutes) - DAY_START_HOUR * 60, PIXELS_PER_MINUTE),
              left: 8,
              right: 8,
              height: getAppointmentHeight(Math.abs(selection.endMinutes - selection.startMinutes) || 30, PIXELS_PER_MINUTE),
              borderRadius: 14,
              border: "1px dashed rgba(0,229,200,0.7)",
              background: "rgba(0,229,200,0.12)",
              zIndex: 5
            }}
          />
        ) : null}

        {appointments.map((appointment) => {
          const startMinute = timeStringToMinutes(appointment.start_time);
          const duration = calculateDuration(appointment.start_time, appointment.end_time);
          return (
            <div key={appointment.id} data-appointment-card="true">
              <AppointmentCard
                appointment={appointment}
                top={getPixelPosition(startMinute - DAY_START_HOUR * 60, PIXELS_PER_MINUTE)}
                height={getAppointmentHeight(duration, PIXELS_PER_MINUTE)}
                isSelected={selectedAppointmentId === appointment.id}
                onSelect={() => onSelectAppointment(appointment.id)}
                onResize={onResizeAppointment}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingComposer({
  open,
  dateKey,
  staff,
  draft,
  onClose,
  onCreated
}: {
  open: boolean;
  dateKey: string;
  staff: StaffMember[];
  draft: DraftSelection | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const [services, setServices] = useState<Array<{ id: string; name: string; duration_minutes: number; price: number }>>([]);
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setClientName("");
      setServiceId("");
      setNotes("");
      setError(null);
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    getOrganizationServices()
      .then((response) => {
        if (!active) return;
        const nextServices = response.services.map((service) => ({
          id: service.id,
          name: service.name,
          duration_minutes: service.duration_minutes,
          price: service.price
        }));
        setServices(nextServices);
        setServiceId((current) => current || nextServices[0]?.id || "");
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load services.");
      });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open || !draft) return null;

  const startIso = minuteToIso(dateKey, draft.startMinutes);
  const selectedService = services.find((service) => service.id === serviceId) ?? null;
  const duration = selectedService?.duration_minutes ?? Math.max(15, draft.endMinutes - draft.startMinutes);
  const selectedStaff = staff.find((member) => member.id === draft.staffId);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (!serviceId) {
        throw new Error("Select a service before creating the booking.");
      }
      await createAppointment({
        staff_member_id: draft.staffId,
        service_id: serviceId,
        start_time: startIso,
        notes: [clientName ? `Client: ${clientName}` : null, notes || null]
          .filter(Boolean)
          .join("\n")
      });
      onCreated();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2,6,23,0.72)",
        display: "grid",
        placeItems: "center",
        zIndex: 40
      }}
    >
      <div
        style={{
          width: "min(520px, calc(100vw - 32px))",
          background: "rgba(12,16,26,0.98)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22,
          boxShadow: "0 28px 80px rgba(0,0,0,0.45)",
          padding: 24
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
          New Booking
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 8 }}>
          {selectedStaff?.full_name ?? "Staff member"} · {format(parseISO(startIso), "EEE d MMM HH:mm")}
        </div>
        <div style={{ fontSize: 13, color: "rgba(148,163,184,0.9)", marginTop: 6 }}>
          Draft duration: {duration} minutes
        </div>

        <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(226,232,240,0.86)" }}>Client name</span>
            <input value={clientName} onChange={(event) => setClientName(event.target.value)} style={inputStyle} placeholder="Sarah Chen" />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(226,232,240,0.86)" }}>Service label</span>
            <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} style={inputStyle}>
              <option value="">Select service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {service.duration_minutes} min · {service.price.toFixed(2)}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(226,232,240,0.86)" }}>Notes</span>
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
          </label>
          {error ? <div style={{ fontSize: 12, color: "#fbbf24" }}>{error}</div> : null}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
          <button type="button" onClick={submit} disabled={saving} style={primaryButtonStyle}>
            {saving ? "Creating..." : "Create booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(15,23,42,0.85)",
  color: "#f8fafc",
  padding: "12px 14px",
  fontSize: 13,
  fontFamily: "inherit"
};

const primaryButtonStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(0,229,200,0.3)",
  background: "rgba(0,229,200,0.14)",
  color: "var(--color-accent)",
  padding: "11px 16px",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "inherit",
  cursor: "pointer"
};

const secondaryButtonStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#cbd5e1",
  padding: "11px 16px",
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "inherit",
  cursor: "pointer"
};

const panelStyle: React.CSSProperties = {
  background: "rgba(12,16,26,0.94)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: 18
};

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
      <span style={{ color: "rgba(148,163,184,0.88)" }}>{label}</span>
      <span style={{ color: "#f8fafc", fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(148,163,184,0.7)" }}>{label}</div>
      <div style={{ fontSize: 13, color: "#e2e8f0" }}>{value}</div>
    </div>
  );
}

export function CalendarEngine() {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [composerDraft, setComposerDraft] = useState<DraftSelection | null>(null);
  const [overlayAppointment, setOverlayAppointment] = useState<CalendarAppointment | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const setSelectedDate = useCalendarStore((state) => state.setSelectedDate);
  const appointments = useCalendarStore((state) => state.appointments);
  const selectedAppointmentId = useCalendarStore((state) => state.selectedAppointmentId);
  const selectAppointment = useCalendarStore((state) => state.selectAppointment);
  const { appointmentsQuery } = useCalendarData();

  useEffect(() => {
    let active = true;
    setLoadingStaff(true);
    getStaffRoster()
      .then((response) => {
        if (!active) return;
        setStaff(response.staff);
        setStaffError(null);
      })
      .catch((error) => {
        if (!active) return;
        setStaffError(error instanceof Error ? error.message : "Unable to load staff roster.");
      })
      .finally(() => {
        if (active) setLoadingStaff(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const groupedAppointments = useMemo(() => {
    const map = new Map<string, CalendarAppointment[]>();
    for (const member of staff) {
      map.set(member.id, []);
    }
    for (const appointment of appointments) {
      const current = map.get(appointment.staff_member_id) ?? [];
      current.push(appointment);
      map.set(appointment.staff_member_id, current);
    }
    for (const value of map.values()) {
      value.sort((left, right) => left.start_time.localeCompare(right.start_time));
    }
    return map;
  }, [appointments, staff]);

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointments, selectedAppointmentId]
  );

  const dailyMetrics = useMemo(() => {
    const confirmedCount = appointments.filter((appointment) => appointment.status === "confirmed").length;
    const activeCount = appointments.filter((appointment) => appointment.status === "checked_in" || appointment.status === "in_progress").length;
    const completedCount = appointments.filter((appointment) => appointment.status === "completed").length;
    const utilisationPct = staff.length
      ? Math.min(
          100,
          Math.round(
            (appointments.reduce((sum, appointment) => sum + calculateDuration(appointment.start_time, appointment.end_time), 0) /
              (staff.length * (DAY_END_HOUR - DAY_START_HOUR) * 60)) *
              100
          )
        )
      : 0;
    return { confirmedCount, activeCount, completedCount, utilisationPct };
  }, [appointments, staff]);

  const persistMove = async (appointment: CalendarAppointment, nextStart: string, nextEnd: string, nextStaffId: string) => {
    setMutationError(null);
    const nextStartMinute = timeStringToMinutes(nextStart);
    const nextEndMinute = timeStringToMinutes(nextEnd);
    const staffAppointments = appointments.filter(
      (candidate) =>
        candidate.id !== appointment.id &&
        candidate.staff_member_id === nextStaffId &&
        overlaps(nextStartMinute, nextEndMinute, timeStringToMinutes(candidate.start_time), timeStringToMinutes(candidate.end_time))
    );

    if (staffAppointments.length) {
      setMutationError("That slot conflicts with an existing appointment.");
      return;
    }

    try {
      await updateAppointment(appointment.id, {
        start_time: nextStart,
        end_time: nextEnd,
        staff_member_id: nextStaffId
      });
      await appointmentsQuery.refetch();
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Unable to update appointment.");
    }
  };

  const handleResize = async (appointment: CalendarAppointment, nextEnd: string) => {
    const appointmentStartMinute = timeStringToMinutes(appointment.start_time);
    const nextEndMinute = timeStringToMinutes(nextEnd);
    const conflict = appointments.some(
      (candidate) =>
        candidate.id !== appointment.id &&
        candidate.staff_member_id === appointment.staff_member_id &&
        overlaps(appointmentStartMinute, nextEndMinute, timeStringToMinutes(candidate.start_time), timeStringToMinutes(candidate.end_time))
    );
    if (conflict) {
      setMutationError("Resize rejected because the new duration overlaps another booking.");
      return;
    }
    try {
      await updateAppointment(appointment.id, { end_time: nextEnd });
      await appointmentsQuery.refetch();
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Unable to resize appointment.");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const appointment = appointments.find((item) => item.id === String(event.active.id)) ?? null;
    setOverlayAppointment(appointment);
    setMutationError(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setOverlayAppointment(null);
    if (!event.over || !event.active) return;

    const appointment = appointments.find((item) => item.id === String(event.active.id));
    const dropData = event.over.data.current as StaffColumnDropData | undefined;
    if (!appointment || !dropData || dropData.type !== "staff-slot") return;

    const duration = calculateDuration(appointment.start_time, appointment.end_time);
    const originalStartMinute = timeStringToMinutes(appointment.start_time);
    const deltaMinutes = Math.round(event.delta.y / PIXELS_PER_MINUTE / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
    const nextMinute = clampMinute(originalStartMinute + deltaMinutes);
    const nextStart = minuteToIso(selectedDate, nextMinute);
    const nextEnd = addMinutes(parseISO(nextStart), duration).toISOString();
    await persistMove(appointment, nextStart, nextEnd, dropData.staffId);
  };

  if (loadingStaff) {
    return <div style={{ padding: 24, fontSize: 13, color: "rgba(148,163,184,0.86)" }}>Loading scheduling surface...</div>;
  }

  if (staffError) {
    return <div style={{ padding: 24, fontSize: 13, color: "#fbbf24" }}>{staffError}</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 16, alignItems: "start" }}>
      <div
        style={{
          background: "rgba(12,16,26,0.94)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-accent)", fontWeight: 700 }}>
              Scheduling Engine
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 6 }}>Day grid for {format(parseISO(`${selectedDate}T00:00:00.000Z`), "EEEE, d MMM yyyy")}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              style={inputStyle}
            />
            <button type="button" style={primaryButtonStyle} onClick={() => setComposerDraft({ staffId: staff[0]?.id ?? "", startMinutes: 9 * 60, endMinutes: 9 * 60 + 30 })}>
              New booking
            </button>
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: "flex", alignItems: "stretch", overflowX: "auto" }}>
            <div
              style={{
                width: 76,
                flexShrink: 0,
                borderRight: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)"
              }}
            >
              <div style={{ height: 60, borderBottom: "1px solid rgba(255,255,255,0.08)" }} />
              <div style={{ position: "relative", height: GRID_HEIGHT }}>
                {generateTimeSlots(DAY_START_HOUR, DAY_END_HOUR - 1, 60).map((slot) => (
                  <div
                    key={slot.formatted}
                    style={{
                      position: "absolute",
                      top: getPixelPosition(slot.time - DAY_START_HOUR * 60, PIXELS_PER_MINUTE) - 7,
                      left: 16,
                      fontSize: 11,
                      color: "rgba(148,163,184,0.82)"
                    }}
                  >
                    {slot.formatted}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", minWidth: "max-content", flex: 1 }}>
              {staff.map((member) => (
                <StaffGridColumn
                  key={member.id}
                  staff={member}
                  appointments={groupedAppointments.get(member.id) ?? []}
                  selectedAppointmentId={selectedAppointmentId}
                  onSelectAppointment={selectAppointment}
                  onOpenDraft={setComposerDraft}
                  onResizeAppointment={handleResize}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {overlayAppointment ? (
              <div
                style={{
                  width: 220,
                  borderRadius: 14,
                  background: "rgba(0,229,200,0.18)",
                  border: "1px solid rgba(0,229,200,0.42)",
                  color: "#f8fafc",
                  padding: "12px 14px",
                  boxShadow: "0 18px 36px rgba(0,0,0,0.3)"
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{overlayAppointment.client_name ?? "Walk-in client"}</div>
                <div style={{ fontSize: 12, marginTop: 4, color: "rgba(226,232,240,0.92)" }}>{overlayAppointment.service_name ?? "Service pending"}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={panelStyle}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
            Live Metrics
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            <MetricRow label="Appointments" value={String(appointments.length)} />
            <MetricRow label="Confirmed" value={String(dailyMetrics.confirmedCount)} />
            <MetricRow label="Active now" value={String(dailyMetrics.activeCount)} />
            <MetricRow label="Completed" value={String(dailyMetrics.completedCount)} />
            <MetricRow label="Utilisation" value={`${dailyMetrics.utilisationPct}%`} />
          </div>
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
            Selected Booking
          </div>
          {selectedAppointment ? (
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>{selectedAppointment.client_name ?? "Walk-in client"}</div>
              <DetailLine label="Service" value={selectedAppointment.service_name ?? "Pending"} />
              <DetailLine label="Staff" value={selectedAppointment.staff_name} />
              <DetailLine label="Time" value={`${format(parseISO(selectedAppointment.start_time), "HH:mm")} - ${format(parseISO(selectedAppointment.end_time), "HH:mm")}`} />
              <DetailLine label="Room" value={selectedAppointment.room ?? "Unassigned"} />
              <DetailLine label="Status" value={selectedAppointment.status.replace("_", " ")} />
              {selectedAppointment.notes ? <div style={{ fontSize: 12, color: "rgba(148,163,184,0.9)", lineHeight: 1.7 }}>{selectedAppointment.notes}</div> : null}
            </div>
          ) : (
            <div style={{ marginTop: 14, fontSize: 13, color: "rgba(148,163,184,0.9)" }}>Select a booking block to inspect details and take action.</div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
            Engine Rules
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 14, fontSize: 12, color: "rgba(148,163,184,0.9)", lineHeight: 1.7 }}>
            <div>15-minute snap grid</div>
            <div>Drag between staff columns to reschedule</div>
            <div>Resize from block handle to change duration</div>
            <div>Conflicts are blocked before persistence</div>
          </div>
          {mutationError ? <div style={{ marginTop: 12, fontSize: 12, color: "#fbbf24" }}>{mutationError}</div> : null}
        </div>
      </div>

      <BookingComposer
        open={Boolean(composerDraft)}
        dateKey={selectedDate}
        staff={staff}
        draft={composerDraft}
        onClose={() => setComposerDraft(null)}
        onCreated={async () => {
          await appointmentsQuery.refetch();
        }}
      />
    </div>
  );
}
