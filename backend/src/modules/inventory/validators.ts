import { z } from "zod";

export const createItemSchema = z.object({
  category_id: z.string().uuid().optional(),
  default_warehouse_id: z.string().uuid().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  uom: z.string().default("unit"),
  cost_price_cents: z.number().int().optional(),
  sell_price_cents: z.number().int().optional(),
  reorder_threshold: z.number().int().nonnegative().default(0),
  track_batches: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const updateItemSchema = createItemSchema.partial();

export const movementSchema = z.object({
  item_id: z.string().uuid(),
  warehouse_id: z.string().uuid().optional(),
  batch_id: z.string().uuid().optional(),
  movement_type: z.enum(["in", "out", "adjust"]),
  quantity: z.number().int().positive(),
  reference_type: z.string().optional(),
  reference_id: z.string().uuid().optional(),
  reason: z.string().optional(),
});

export const reservationSchema = z.object({
  booking_id: z.string().uuid(),
  requirements: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().int().positive()
  })).min(1)
});

export const createBatchSchema = z.object({
  item_id: z.string().uuid(),
  warehouse_id: z.string().uuid().optional(),
  lot_number: z.string().optional(),
  expiry_date: z.string().optional(),
  quantity: z.number().int().positive()
});
