import { z } from "zod";

export const bookingCreateSchema = z.object({
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  pickup_address: z.string().min(1),
  dropoff_address: z.string().min(1),
  pickup_at: z.string().optional(),
  dropoff_at: z.string().optional(),
  price_cents: z.number().int().optional(),
  currency: z.string().optional(),
  status: z.string().optional(),
  related_booking_id: z.string().uuid().optional()
});
export const bookingUpdateSchema = bookingCreateSchema.partial();

export const assignmentSchema = z.object({
  agent_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
  status: z.string().optional()
});

export const podSchema = z.object({
  collected_by: z.string().optional(),
  signature_url: z.string().optional(),
  photo_url: z.string().optional(),
  notes: z.string().optional()
});
