import { useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import PageLayout from "@/components/ui/PageLayout";
import FormSection from "@/components/ui/FormSection";
import FormField from "@/components/ui/FormField";
import { useCrud } from "@/hooks/useCrud";
import { useToast } from "@/contexts/KoraToastContext";
import type { StaffMember } from "@/types";

export default function CreateStaffMembersPage() {
  const navigate = useNavigate();
  const { create } = useCrud<StaffMember>("/api/staff");
  const { showToast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StaffMember>();

  const onSubmit: SubmitHandler<StaffMember> = async (values) => {
    try {
      await create(values);
      showToast("Staff member created successfully", "success");
      navigate("/app/business-admin/staff");
    } catch (err) {
      showToast("Failed to create staff member", "error");
    }
  };

  return (
    <PageLayout title="New Staff Member">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <FormSection title="Basic Information" description="Add a new team member">
          <FormField label="Full name" required error={errors.full_name?.message?.toString()}>
            <input {...register("full_name", { required: "Full name is required" })} type="text" className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
          <FormField label="Role" error={errors.role?.message?.toString()}>
            <select {...register("role")} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600">
              <option value="">-- Select --</option>
              <option value="therapist">Therapist</option>
              <option value="doctor">Doctor</option>
              <option value="technician">Technician</option>
              <option value="receptionist">Receptionist</option>
              <option value="driver">Driver</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>
          <FormField label="Status" error={errors.status?.message?.toString()}>
            <select {...register("status")} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </FormField>
        </FormSection>
        <FormSection title="Contact Information" description="Email and phone details">
          <FormField label="Email" error={errors.email?.message?.toString()}>
            <input {...register("email")} type="email" className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
          <FormField label="Phone" error={errors.phone?.message?.toString()}>
            <input {...register("phone")} type="text" className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
        </FormSection>
        <FormSection title="Additional Details" description="Bio and other information">
          <FormField label="Bio" error={errors.bio?.message?.toString()}>
            <textarea {...register("bio")} rows={3} className="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600" />
          </FormField>
        </FormSection>
        <div className="mt-6 flex gap-3">
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50">
            {isSubmitting ? "Creating…" : "Create Staff Member"}
          </button>
          <button type="button" onClick={() => navigate("/app/business-admin/staff")} className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700">Cancel</button>
        </div>
      </form>
    </PageLayout>
  );
}
