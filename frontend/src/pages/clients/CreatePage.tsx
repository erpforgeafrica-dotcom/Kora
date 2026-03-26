import { useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import PageLayout from "@/components/ui/PageLayout";
import { useCrud } from "@/hooks/useCrud";
import type { Client } from "@/types";

export default function CreateCustomersPage() {
  const navigate = useNavigate();
  const { create } = useCrud<Client>("/api/clients");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Client>({
    defaultValues: {
      membership_tier: "bronze",
      loyalty_points: 0,
      telehealth_consent: false,
    } as any,
  });

  const onSubmit: SubmitHandler<Client> = async (values) => {
    await create(values);
    navigate("/app/business-admin/clients");
  };

  return (
    <PageLayout title="New Client">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-w-lg bg-slate-800 rounded-lg">
        <label className="block">
          <span className="text-sm text-gray-300">Full name *</span>
          <input
            {...register("full_name", { required: "Full name is required" })}
            type="text"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          />
          {errors.full_name && <p className="text-xs text-red-400 mt-1">{errors.full_name.message?.toString()}</p>}
        </label>

        <label className="block">
          <span className="text-sm text-gray-300">Email *</span>
          <input
            {...register("email", { required: "Email is required" })}
            type="email"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          />
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message?.toString()}</p>}
        </label>

        <label className="block">
          <span className="text-sm text-gray-300">Phone</span>
          <input
            {...register("phone")}
            type="text"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          />
          {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message?.toString()}</p>}
        </label>

        <label className="block">
          <span className="text-sm text-gray-300">Membership Tier</span>
          <select
            {...register("membership_tier")}
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          >
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input {...register("telehealth_consent")} type="checkbox" className="h-4 w-4" />
          <span className="text-sm text-gray-300">Telehealth consent on file</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create Client"}
        </button>
      </form>
    </PageLayout>
  );
}
