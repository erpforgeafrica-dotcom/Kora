import { z } from "zod";

// ─── CLIENT VALIDATORS ───────────────────────────────────────────────────
export const createClientSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  telehealth_consent: z.boolean().optional(),
  preferences: z.record(z.string(), z.any()).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// ─── BOOKING VALIDATORS ──────────────────────────────────────────────────
export const createBookingSchema = z.object({
  client_id: z.string().uuid().optional().nullable(),
  service_id: z.string().uuid("Invalid service ID"),
  staff_member_id: z.string().uuid("Invalid staff member ID"),
  room_id: z.string().uuid().optional().nullable(),
  start_time: z.string().datetime("Invalid start time"),
  source: z.enum(["web", "mobile", "phone", "walk_in"]).optional(),
  notes: z.string().optional().nullable(),
});

export const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show"]).optional(),
  notes: z.string().optional().nullable(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  staff_member_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

// ─── SERVICE VALIDATORS ──────────────────────────────────────────────────
export const createServiceSchema = z.object({
  name: z.string().min(1, "Service name is required").max(255),
  description: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  duration_minutes: z.number().int().positive("Duration must be positive"),
  price_cents: z.number().int().nonnegative("Price cannot be negative"),
  is_active: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

// ─── STAFF VALIDATORS ────────────────────────────────────────────────────
export const createStaffSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Invalid email address"),
  role: z.enum(["therapist", "doctor", "technician", "receptionist", "driver", "manager", "admin"]),
  clerk_user_id: z.string().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  specializations: z.array(z.string()).optional(),
  availability: z.record(z.string(), z.any()).optional(),
  photo_url: z.string().url().optional().nullable(),
});

export const updateStaffSchema = z.object({
  full_name: z.string().max(255).optional(),
  email: z.string().email().optional(),
  role: z.enum(["therapist", "doctor", "technician", "receptionist", "driver", "manager", "admin"]).optional(),
  photo_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional(),
  specializations: z.array(z.string()).optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ─── PAYMENT VALIDATORS ──────────────────────────────────────────────────
export const createPaymentIntentSchema = z.object({
  amount_cents: z.number().int().positive("Amount must be positive"),
  currency: z.string().length(3).default("usd"),
  invoice_id: z.string().uuid().optional(),
  booking_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(["pending", "processing", "succeeded", "failed", "cancelled", "refunded"]).optional(),
  payment_method: z.string().optional(),
  receipt_url: z.string().url().optional().nullable(),
});

export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

// ─── TENANT VALIDATORS ────────────────────────────────────────────────────
export const createTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required").max(255),
  subscription_plan: z.string().optional(),
  industry: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "suspended", "trial", "cancelled"]).optional(),
});

export const updateTenantSchema = createTenantSchema.partial();

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

// ─── SUBSCRIPTION VALIDATORS ──────────────────────────────────────────────
export const createSubscriptionSchema = z.object({
  tenant_id: z.string().uuid(),
  plan: z.string().min(1, "Plan name is required"),
  status: z.enum(["active", "trial", "past_due", "cancelled", "expired"]).optional(),
  current_period_end: z.string().datetime().optional().nullable(),
});

export const updateSubscriptionSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  plan: z.string().min(1).optional(),
  status: z.enum(["active", "trial", "past_due", "cancelled", "expired"]).optional(),
  current_period_end: z.string().datetime().optional().nullable(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

// ─── VALIDATION HELPER ───────────────────────────────────────────────────
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { valid: true; data: T } | { valid: false; errors: Record<string, string> } {
  try {
    const parsed = schema.parse(data);
    return { valid: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        errors[path] = issue.message;
      });
      return { valid: false, errors };
    }
    return { valid: false, errors: { _: "Validation failed" } };
  }
}
