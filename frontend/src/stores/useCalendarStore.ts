import { create } from "zustand";
import type { CalendarAppointment } from "../services/api";

export interface CalendarDraft {
  staff_member_id: string;
  start_time: string;
  end_time: string;
}

interface CalendarStore {
  selectedDate: string;
  appointments: CalendarAppointment[];
  selectedAppointmentId: string | null;
  draft: CalendarDraft | null;
  dragState: { appointmentId: string | null; previewStart: string | null; previewStaffId: string | null };
  setSelectedDate: (date: string) => void;
  setAppointments: (appointments: CalendarAppointment[]) => void;
  selectAppointment: (appointmentId: string | null) => void;
  setDraft: (draft: CalendarDraft | null) => void;
  setDragPreview: (appointmentId: string | null, previewStart: string | null, previewStaffId: string | null) => void;
  moveAppointment: (appointmentId: string, nextStart: string, nextEnd: string, nextStaffId: string) => void;
  resizeAppointment: (appointmentId: string, nextEnd: string) => void;
  createAppointmentOptimistic: (appointment: CalendarAppointment) => void;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  selectedDate: todayKey(),
  appointments: [],
  selectedAppointmentId: null,
  draft: null,
  dragState: { appointmentId: null, previewStart: null, previewStaffId: null },
  setSelectedDate: (date) => set({ selectedDate: date }),
  setAppointments: (appointments) => set({ appointments }),
  selectAppointment: (appointmentId) => set({ selectedAppointmentId: appointmentId }),
  setDraft: (draft) => set({ draft }),
  setDragPreview: (appointmentId, previewStart, previewStaffId) =>
    set({ dragState: { appointmentId, previewStart, previewStaffId } }),
  moveAppointment: (appointmentId, nextStart, nextEnd, nextStaffId) =>
    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, start_time: nextStart, end_time: nextEnd, staff_member_id: nextStaffId }
          : appointment
      ),
      dragState: { appointmentId: null, previewStart: null, previewStaffId: null }
    })),
  resizeAppointment: (appointmentId, nextEnd) =>
    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === appointmentId ? { ...appointment, end_time: nextEnd } : appointment
      )
    })),
  createAppointmentOptimistic: (appointment) =>
    set((state) => ({
      appointments: [...state.appointments, appointment],
      draft: null
    }))
}));
