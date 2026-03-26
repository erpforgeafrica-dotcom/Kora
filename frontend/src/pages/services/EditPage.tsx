import { useNavigate, useParams } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { useEffect } from "react";
import PageLayout from "@/components/ui/PageLayout";
import FormSection from "@/components/ui/FormSection";
import FormField from "@/components/ui/FormField";
import { useCrud } from "@/hooks/useCrud";
import { useToast } from "@/contexts/KoraToastContext";
import type { Service } from "@/types";

export default function EditServicesPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, update } = useCrud<Service>("/api/services");
  const { showToast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Service>();

  useEffect(() => {
    const item = data?.find(d => d.id === id);
    if (item) reset(item);
  }, [data, id, reset]);

  const onSubmit: SubmitHandler<Service> = async (values) => {
    try {
      if (id) await update(id, values);
      showToast("Service updated successfully", "success");
      navigate("/app/business-admin/services");
    } catch (err) {
      showToast("Failed to update service", "error");
    }
  };

  return (
    <PageLayout title="Edit Service">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <FormSection title="Service Information" description="Update service details">
          <FormField label="Service name" required error={errors.name?.message?.toString()}>
            <input {...register("name", { required: "Service name is required" })} type="text" className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
          <FormField label="Category" error={errors.category_id?.message?.toString()}>
            <select {...register("category_id")} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600">
              <option value="">-- Select --</option>
            </select>
          </FormField>
          <FormField label="Description" error={errors.description?.message?.toString()}>
            <textarea {...register("description")} rows={3} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
          <FormField label="Internal notes" error={errors.notes?.message?.toString()}>
            <textarea {...register("notes")} rows={3} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
        </FormSection>
        <FormSection title="Pricing & Duration" description="Update pricing and time requirements">
          <FormField label="Duration (minutes)" required error={errors.duration_minutes?.message?.toString()}>
            <input {...register("duration_minutes", { required: "Duration is required" })} type="number" className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
          <FormField label="Price (cents)" required error={errors.price_cents?.message?.toString()}>
            <input {...register("price_cents", { required: "Price is required" })} type="number" className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
          <FormField label="Currency" error={errors.currency?.message?.toString()}>
            <input {...register("currency")} type="text" placeholder="GBP" className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
        </FormSection>
        <FormSection title="Status" description="Control whether this service is available for booking">
          <FormField label="Active">
            <input {...register("active")} type="checkbox" className="h-4 w-4" />
          </FormField>
        </FormSection>
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50">
            {isSubmitting ? "Saving…" : "Save Changes"}
          </button>
          <button type="button" onClick={() => navigate("/app/business-admin/services")} className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700">Cancel</button>
        </div>
      </form>
    </PageLayout>
  );
}
