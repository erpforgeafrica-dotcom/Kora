import { useNavigate, useParams } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import PageLayout from "@/components/ui/PageLayout";
import FormSection from "@/components/ui/FormSection";
import FormField from "@/components/ui/FormField";
import { useCrud } from "@/hooks/useCrud";
import { useToast } from "@/contexts/KoraToastContext";
import type { Booking, Client, Service, StaffMember } from "@/types";

export default function EditBookingsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, update } = useCrud<Booking>("/api/bookings");
  const { data: clients } = useCrud<Client>("/api/clients");
  const { data: services } = useCrud<Service>("/api/services");
  const { data: staff } = useCrud<StaffMember>("/api/staff");
  const { showToast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Booking>();

  useEffect(() => {
    const item = data?.find(d => d.id === id);
    if (item) reset(item);
  }, [data, id, reset]);

  const onSubmit: SubmitHandler<Booking> = async (values) => {
    try {
      if (id) await update(id, values);
      showToast("Booking updated successfully", "success");
      navigate("/app/business-admin/bookings");
    } catch (err) {
      showToast("Failed to update booking", "error");
    }
  };

  return (
    <PageLayout title="Edit Booking">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <FormSection title="Booking Details" description="Update appointment information">
          <FormField label="Customer" required error={errors.client_id?.message?.toString()}>
            <select {...register("client_id", { required: "Customer is required" })} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600">
              <option value="">-- Select --</option>
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Service" required error={errors.service_id?.message?.toString()}>
            <select {...register("service_id", { required: "Service is required" })} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600">
              <option value="">-- Select --</option>
              {(services ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Staff" error={errors.staff_id?.message?.toString()}>
            <select {...register("staff_id")} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600">
              <option value="">-- Select --</option>
              {(staff ?? []).map((sm) => (
                <option key={sm.id} value={sm.id}>
                  {sm.full_name || sm.email || sm.id}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Start time" required error={errors.start_time?.message?.toString()}>
            <input {...register("start_time", { required: "Start time is required" })} type="datetime-local" className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
          <FormField label="End time" required error={errors.end_time?.message?.toString()}>
            <input {...register("end_time", { required: "End time is required" })} type="datetime-local" className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
          <FormField label="Status" error={errors.status?.message?.toString()}>
            <select {...register("status")} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </FormField>
          <FormField label="Notes" error={errors.notes?.message?.toString()}>
            <textarea {...register("notes")} rows={3} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
        </FormSection>
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50">
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
          <button type="button" onClick={() => navigate("/app/business-admin/bookings")} className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700">Cancel</button>
        </div>
      </form>
    </PageLayout>
  );
}
