import { useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import PageLayout from "@/components/ui/PageLayout";
import { createTenant, type TenantRecord } from "@/services/platformAdmin";

type TenantForm = Pick<TenantRecord, "name" | "industry" | "status">;

export default function CreateTenantPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TenantForm>({
    defaultValues: {
      status: "active",
      industry: ""
    }
  });

  const onSubmit: SubmitHandler<TenantForm> = async (values) => {
    await createTenant({
      name: values.name,
      industry: values.industry || null,
      status: values.status
    });
    navigate("/app/kora-admin/tenants");
  };

  return (
    <PageLayout title="New Tenant">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-w-lg bg-slate-800 rounded-lg">
        <label className="block">
          <span className="text-sm text-gray-300">Tenant Name *</span>
          <input
            {...register("name", { required: true })}
            type="text"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          />
          {errors.name && <p className="text-xs text-red-400 mt-1">Tenant name is required</p>}
        </label>
        <label className="block">
          <span className="text-sm text-gray-300">Industry</span>
          <input
            {...register("industry")}
            type="text"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-300">Status</span>
          <select
            {...register("status")}
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          >
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create Tenant"}
        </button>
      </form>
    </PageLayout>
  );
}
