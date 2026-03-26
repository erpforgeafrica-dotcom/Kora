import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAppointment, getAppointments, updateAppointment } from "../services/api";
import { useCalendarStore } from "../stores/useCalendarStore";

export function useCalendarData() {
  const queryClient = useQueryClient();
  const selectedDate = useCalendarStore((state) => state.selectedDate);
  const setAppointments = useCalendarStore((state) => state.setAppointments);

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", selectedDate],
    queryFn: async () => getAppointments(selectedDate)
  });

  useEffect(() => {
    if (appointmentsQuery.data?.appointments) {
      setAppointments(appointmentsQuery.data.appointments);
    }
  }, [appointmentsQuery.data, setAppointments]);

  const updateMutation = useMutation({
    mutationFn: ({ appointmentId, payload }: { appointmentId: string; payload: Parameters<typeof updateAppointment>[1] }) =>
      updateAppointment(appointmentId, payload),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments", selectedDate] });
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createAppointment>[0]) => createAppointment(payload),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments", selectedDate] });
    }
  });

  return {
    appointmentsQuery,
    updateMutation,
    createMutation
  };
}
