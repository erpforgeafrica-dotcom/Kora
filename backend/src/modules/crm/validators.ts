import { z } from "zod";

export const leadCreateSchema = z.object({
  status: z.enum(["new","contacted","qualified","converted","lost"]).optional(),
  source: z.string().optional(),
  full_name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  score: z.number().optional(),
  notes: z.string().optional()
});

export const leadUpdateSchema = leadCreateSchema.partial();

export const qualifySchema = z.object({
  score: z.number().min(0).max(100),
  notes: z.string().optional()
});

export const dealCreateSchema = z.object({
  contact_id: z.string().uuid().optional(),
  account_id: z.string().uuid().optional(),
  title: z.string().min(1),
  stage: z.string().optional(),
  value_cents: z.number().int().optional(),
  currency: z.string().optional(),
  probability: z.number().optional(),
  close_date: z.string().optional(),
  owner_id: z.string().uuid().optional()
});
export const dealUpdateSchema = dealCreateSchema.partial();

export const activityCreateSchema = z.object({
  lead_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  activity_type: z.string().min(1),
  subject: z.string().min(1),
  due_at: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  notes: z.string().optional()
});
