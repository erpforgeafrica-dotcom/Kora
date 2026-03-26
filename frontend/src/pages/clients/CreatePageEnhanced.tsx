import { useNavigate } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import PageLayout from "@/components/ui/PageLayout";
import FormSection from "@/components/ui/FormSection";
import FormField from "@/components/ui/FormField";
import { useCrud } from "@/hooks/useCrud";
import { useToast } from "@/contexts/KoraToastContext";
import type { Client } from "@/types";
import { useState } from "react";

export default function CreateClientPageEnhanced() {
  const navigate = useNavigate();
  const { create } = useCrud<Client>("/api/clients");
  const { showToast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<Client>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit: SubmitHandler<Client> = async (values) => {
    setIsSubmitting(true);
    try {
      await create(values);
      showToast("Client created successfully", "success");
      navigate("/app/business-admin/clients");
    } catch (err: any) {
      showToast(err.message || "Failed to create client", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout 
      title="New Client"
      actions={
        <button
          type="button"
          onClick={() => navigate("/app/business-admin/clients")}
          style={{
            padding: "10px 16px",
            background: "var(--color-surface-2)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace"
          }}
        >
          Cancel
        </button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 800 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <FormSection title="Personal Information" description="Basic client details">
            <FormField
              label="Full Name"
              required
              {...register("full_name", { required: "Full name is required" })}
              error={errors.full_name?.message}
            />
            
            <FormField
              label="Email"
              type="email"
              required
              {...register("email", { 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
              error={errors.email?.message}
            />
            
            <FormField
              label="Phone"
              type="tel"
              {...register("phone")}
              error={errors.phone?.message}
            />
          </FormSection>

          <FormSection title="Preferences" description="Consent and optional preferences">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "'DM Mono', monospace",
                color: "var(--color-text-primary)",
                fontSize: 13
              }}
            >
              <input type="checkbox" {...register("telehealth_consent")} />
              Telehealth consent
            </label>
          </FormSection>

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => navigate("/app/business-admin/clients")}
              style={{
                padding: "10px 20px",
                background: "var(--color-surface-2)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "10px 20px",
                background: isSubmitting ? "var(--color-surface-2)" : "var(--color-accent)",
                color: isSubmitting ? "var(--color-text-muted)" : "white",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {isSubmitting ? "Creating..." : "Create Client"}
            </button>
          </div>
        </div>
      </form>
    </PageLayout>
  );
}
