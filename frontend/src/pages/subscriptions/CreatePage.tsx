import { useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import PageLayout from "@/components/ui/PageLayout";
import { createSubscription, type SubscriptionRecord } from "@/services/platformAdmin";

type SubscriptionForm = Pick<SubscriptionRecord, "organization_id" | "plan" | "status" | "current_period_start" | "current_period_end" | "provider_subscription_id">;

export default function CreateSubscriptionPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SubscriptionForm>({
    defaultValues: {
      status: "active"
    }
  });

  const onSubmit: SubmitHandler<SubscriptionForm> = async (values) => {
    await createSubscription({
      organization_id: values.organization_id,
      plan: values.plan,
      status: values.status,
      current_period_start: values.current_period_start,
      current_period_end: values.current_period_end || null,
      provider_subscription_id: values.provider_subscription_id || null
    });
    navigate("/app/kora-admin/subscriptions");
  };

  return (
    <PageLayout title="New Subscription">
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-w-lg bg-slate-800 rounded-lg">
        <label className="block">
          <span className="text-sm text-gray-300">Organization ID *</span>
          <input
            {...register("organization_id", { required: true })}
            type="text"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          />
          {errors.organization_id && <p className="text-xs text-red-400 mt-1">Organization ID is required</p>}
        </label>
        <label className="block">
          <span className="text-sm text-gray-300">Plan *</span>
          <input
            {...register("plan", { required: true })}
            type="text"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          />
          {errors.plan && <p className="text-xs text-red-400 mt-1">Plan is required</p>}
        </label>
        <label className="block">
          <span className="text-sm text-gray-300">Status</span>
          <select
            {...register("status")}
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          >
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-gray-300">Period Start *</span>
          <input
            {...register("current_period_start", { required: true })}
            type="datetime-local"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          />
          {errors.current_period_start && <p className="text-xs text-red-400 mt-1">Period start is required</p>}
        </label>
        <label className="block">
          <span className="text-sm text-gray-300">Period End</span>
          <input
            {...register("current_period_end")}
            type="datetime-local"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          />
        </label>
        <label className="block">
          <span className="text-sm text-gray-300">Provider Subscription ID</span>
          <input
            {...register("provider_subscription_id")}
            type="text"
            className="mt-1 block w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600"
          />
        </label>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create Subscription"}
        </button>
      </form>
    </PageLayout>
  );
}
