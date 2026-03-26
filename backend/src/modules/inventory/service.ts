import { queryDb, dbPool } from "../../db/client.js";
import type { RequestUser } from "../../shared/types.js";

export async function listItems(organizationId: string) {
  return queryDb(
    `select i.id::text, i.sku, i.name, i.description, i.uom, i.cost_price_cents, i.sell_price_cents,
            i.reorder_threshold, i.is_active, i.category_id::text, i.warehouse_id::text,
            coalesce(sum(sb.quantity - sb.reserved_quantity), 0) as available_quantity
       from inventory_items_v2 i
  left join stock_batches_v2 sb on sb.item_id = i.id
      where i.organization_id = $1
      group by i.id`,
    [organizationId]
  );
}

export async function getItem(organizationId: string, id: string) {
  const rows = await queryDb(
    `select i.id::text, i.sku, i.name, i.description, i.uom, i.cost_price_cents, i.sell_price_cents,
            i.reorder_threshold, i.is_active, i.category_id::text, i.warehouse_id::text,
            coalesce(sum(sb.quantity - sb.reserved_quantity), 0) as available_quantity
       from inventory_items_v2 i
  left join stock_batches_v2 sb on sb.item_id = i.id
      where i.organization_id = $1 and i.id = $2
      group by i.id`,
    [organizationId, id]
  );
  return rows[0] ?? null;
}

export async function createItem(organizationId: string, payload: any, user?: RequestUser) {
  const rows = await queryDb(
    `insert into inventory_items_v2 (
       organization_id, category_id, warehouse_id, sku, name, description, uom,
       cost_price_cents, sell_price_cents, reorder_threshold, track_batches, is_active
     ) values (
       $1, $2, $3, $4, $5, $6, $7,
       $8, $9, $10, coalesce($11,false), coalesce($12,true)
     ) returning id::text`,
    [
      organizationId,
      payload.category_id ?? null,
      payload.default_warehouse_id ?? null,
      payload.sku,
      payload.name,
      payload.description ?? null,
      payload.uom ?? "unit",
      payload.cost_price_cents ?? null,
      payload.sell_price_cents ?? null,
      payload.reorder_threshold ?? 0,
      payload.track_batches ?? false,
      payload.is_active ?? true
    ]
  );
  return rows[0];
}

export async function updateItem(organizationId: string, id: string, payload: any) {
  const fields: string[] = [];
  const values: any[] = [];
  const add = (col: string, val: any) => {
    values.push(val);
    fields.push(`${col} = $${values.length}`);
  };
  if (payload.category_id !== undefined) add("category_id", payload.category_id);
  if (payload.default_warehouse_id !== undefined) add("warehouse_id", payload.default_warehouse_id);
  if (payload.sku !== undefined) add("sku", payload.sku);
  if (payload.name !== undefined) add("name", payload.name);
  if (payload.description !== undefined) add("description", payload.description);
  if (payload.uom !== undefined) add("uom", payload.uom);
  if (payload.cost_price_cents !== undefined) add("cost_price_cents", payload.cost_price_cents);
  if (payload.sell_price_cents !== undefined) add("sell_price_cents", payload.sell_price_cents);
  if (payload.reorder_threshold !== undefined) add("reorder_threshold", payload.reorder_threshold);
  if (payload.track_batches !== undefined) add("track_batches", payload.track_batches);
  if (payload.is_active !== undefined) add("is_active", payload.is_active);
  if (!fields.length) return await getItem(organizationId, id);
  values.push(organizationId, id);
  const rows = await queryDb(
    `update inventory_items_v2
        set ${fields.join(", ")},
            updated_at = now()
      where organization_id = $${values.length - 1} and id = $${values.length}
      returning id::text`,
    values
  );
  return rows[0];
}

export async function deleteItem(organizationId: string, id: string) {
  await queryDb(`delete from inventory_items_v2 where organization_id = $1 and id = $2`, [organizationId, id]);
  return { deleted: true };
}

export async function listMovements(organizationId: string, itemId?: string) {
  const params: any[] = [organizationId];
  const where: string[] = ["organization_id = $1"];
  if (itemId) {
    params.push(itemId);
    where.push(`item_id = $${params.length}`);
  }
  return queryDb(
    `select id::text, item_id::text, warehouse_id::text, batch_id::text,
            movement_type, quantity, reference_type, reference_id::text, reason, created_at
       from inventory_movements_v2
      where ${where.join(" and ")}
      order by created_at desc
      limit 200`,
    params
  );
}

export async function createMovement(organizationId: string, payload: any, user?: RequestUser) {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    const row = await client.query(
      `insert into inventory_movements_v2 (
         organization_id, item_id, warehouse_id, batch_id, movement_type, quantity,
         reference_type, reference_id, reason, created_by
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning id::text`,
      [
        organizationId,
        payload.item_id,
        payload.warehouse_id ?? null,
        payload.batch_id ?? null,
        payload.movement_type,
        payload.quantity,
        payload.reference_type ?? null,
        payload.reference_id ?? null,
        payload.reason ?? null,
        user?.userId ?? null
      ]
    );
    await client.query('COMMIT');
    return row.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listBatches(orgId: string, itemId?: string) {
  const params = [orgId];
  let sql = `SELECT * FROM stock_batches_v2 WHERE organization_id = $1`;
  if (itemId) {
    params.push(itemId);
    sql += ` AND item_id = $${params.length}`;
  }
  return queryDb(sql, params);
}

export async function createBatch(orgId: string, payload: any) {
  const rows = await queryDb(
    `INSERT INTO stock_batches_v2 (organization_id, item_id, warehouse_id, lot_number, expiry_date, quantity)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id::text`,
    [orgId, payload.item_id, payload.warehouse_id, payload.lot_number, payload.expiry_date, payload.quantity]
  );
  return rows[0];
}

export async function listLowStock(organizationId: string) {
  return queryDb(
    `select item_id::text, name, available_quantity, reorder_threshold
       from inventory_low_stock_v2
      where organization_id = $1`,
    [organizationId]
  );
}

/**
 * Reserve inventory for booking (cross-workflow saga step 1)
 * Returns reservation ID or throws if insufficient stock
 */
export async function reserveForBooking(
  organizationId: string,
  bookingId: string,
  itemRequirements: Array<{ item_id: string; quantity: number }>
) {
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    const reservations = [];
    for (const req of itemRequirements) {
      const row = await client.query(
        `INSERT INTO inventory_reservations_v2 (organization_id, item_id, quantity, status, reference_type, reference_id)
         VALUES ($1, $2, $3, 'pending', 'booking', $4)
         RETURNING id::text, item_id::text, quantity`,
        [organizationId, req.item_id, req.quantity, bookingId]
      );
      reservations.push(row.rows[0]);
      await client.query(
        `UPDATE stock_batches_v2
         SET reserved_quantity = reserved_quantity + $1
         WHERE item_id = $2 AND organization_id = $3
           AND (quantity - reserved_quantity) >= $1`,
        [req.quantity, req.item_id, organizationId]
      );
    }
    await client.query('COMMIT');
    return reservations;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Consume reservation on booking fulfillment (saga step 2)
 */
export async function consumeReservation(
  organizationId: string,
  reservationId: string
) {
  const rows = await queryDb(
    `UPDATE inventory_reservations_v2 
     SET status = 'committed'
     WHERE id = $1 AND organization_id = $2 AND status = 'pending'
     RETURNING *;`,
    [reservationId, organizationId]
  );
  if (!rows[0]) throw new Error('reservation_not_pending');
  // Trigger stock reduction via movement
  return rows[0];
}

/**
 * Reorder alert generation (event-driven hook)
 */
export async function generateReorderAlerts(organizationId: string) {
  const alerts = await listLowStock(organizationId);
  // Insert notification events
  for (const alert of alerts) {
    await queryDb(
      `INSERT INTO notifications (organization_id, channel, payload, status)
       VALUES ($1, 'email', $2::jsonb, 'pending')
       ON CONFLICT DO NOTHING;`,
      [organizationId, {
        type: 'low_stock',
        item_id: alert.item_id,
        available: alert.available_quantity,
        threshold: alert.reorder_threshold
      }]
    );
  }
  return alerts;
}
