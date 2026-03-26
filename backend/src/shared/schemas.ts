import { z } from "zod";

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Common IDs
export const uuidSchema = z.string().uuid();
export const organizationIdSchema = z.string().uuid();

// Auth
export const apiKeySchema = z.string().min(32).max(256);

// Timestamps
export const timestampSchema = z.coerce.date();

// Module-specific schemas
export const createClientSchema = z.object({
  full_name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(10).max(20).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dob: z.string().date().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const createAppointmentSchema = z.object({
  patient_id: uuidSchema,
  staff_id: uuidSchema,
  scheduled_at: timestampSchema,
  duration_minutes: z.number().int().positive(),
  notes: z.string().max(1000).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]),
});

export const createInvoiceSchema = z.object({
  client_id: uuidSchema,
  amount: z.number().positive(),
  description: z.string().max(500),
  due_date: timestampSchema.optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
});

export const createNotificationSchema = z.object({
  recipient_id: uuidSchema,
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  type: z.enum(["info", "warning", "error", "success"]),
  channel: z.enum(["email", "sms", "push", "in_app"]).optional(),
});

export const dispatchReportSchema = z.object({
  report_type: z.enum(["revenue", "bookings", "staff_performance", "compliance"]),
  date_range: z.object({
    start: timestampSchema,
    end: timestampSchema,
  }),
  format: z.enum(["pdf", "csv", "json"]).default("json"),
});

export const createVideoSessionSchema = z.object({
  participant_ids: z.array(uuidSchema).min(2),
  scheduled_at: timestampSchema,
  duration_minutes: z.number().int().positive(),
  title: z.string().max(255).optional(),
});

export const createEmergencyRequestSchema = z.object({
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(1).max(1000),
  unit_type: z.enum(["ambulance", "fire", "police"]).optional(),
});

export const updateEmergencyStatusSchema = z.object({
  status: z.enum(["pending", "assigned", "en_route", "on_scene", "resolved"]),
});

export const orchestrateCommandSchema = z.object({
  action: z.string().min(1).max(255),
  module: z.string().min(1).max(50),
  params: z.record(z.unknown()).optional(),
  auto_execute: z.boolean().default(false),
});

export const orchestrateFeedbackSchema = z.object({
  command_id: uuidSchema,
  outcome: z.enum(["accepted", "rejected", "executed"]),
  notes: z.string().max(500).optional(),
});
