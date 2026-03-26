import { queryDb } from "../../db/client.js";
import type { RequestUser } from "../../shared/types.js";

export async function listBookings(orgId: string) {
  return queryDb(
    `select id::text, customer_name, customer_phone, pickup_address, dropoff_address,
            pickup_at, dropoff_at, price_cents, currency, status, created_at
       from delivery_bookings
      where organization_id = $1
      order by created_at desc
      limit 200`,
    [orgId]
  );
}

export async function createBooking(orgId: string, payload: any) {
  const rows = await queryDb(
    `insert into delivery_bookings (
       organization_id, customer_name, customer_phone, pickup_address, dropoff_address,
       pickup_at, dropoff_at, price_cents, currency, status, related_booking_id
     ) values (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
     ) returning id::text`,
    [
      orgId,
      payload.customer_name ?? null,
      payload.customer_phone ?? null,
      payload.pickup_address,
      payload.dropoff_address,
      payload.pickup_at ?? null,
      payload.dropoff_at ?? null,
      payload.price_cents ?? null,
      payload.currency ?? "usd",
      payload.status ?? "pending",
      payload.related_booking_id ?? null
    ]
  );
  return rows[0];
}

export async function updateBooking(orgId: string, id: string, payload: any) {
  const fields: string[] = [];
  const values: any[] = [];
  const add = (col: string, val: any) => { values.push(val); fields.push(`${col} = $${values.length}`); };
  for (const key of ["customer_name","customer_phone","pickup_address","dropoff_address","pickup_at","dropoff_at","price_cents","currency","status"]) {
    if (payload[key] !== undefined) add(key, payload[key]);
  }
  if (!fields.length) return await getBooking(orgId, id);
  values.push(orgId, id);
  const rows = await queryDb(
    `update delivery_bookings set ${fields.join(", ")}, updated_at = now()
      where organization_id = $${values.length-1} and id = $${values.length}
      returning id::text`,
    values
  );
  return rows[0];
}

export async function getBooking(orgId: string, id: string) {
  const rows = await queryDb(
    `select * from delivery_bookings where organization_id = $1 and id = $2 limit 1`,
    [orgId, id]
  );
  return rows[0] ?? null;
}

export async function listAgents(orgId: string) {
  return queryDb(`select * from delivery_agents where organization_id = $1`, [orgId]);
}
export async function createAgent(orgId: string, payload: any) {
  const rows = await queryDb(
    `insert into delivery_agents (organization_id, full_name, phone, status)
     values ($1,$2,$3,coalesce($4,'active'))
     returning *`,
    [orgId, payload.full_name, payload.phone ?? null, payload.status ?? "active"]
  );
  return rows[0];
}

export async function listAssignments(orgId: string, bookingId: string) {
  return queryDb(
    `select * from delivery_assignments where organization_id=$1 and delivery_booking_id=$2 order by assigned_at desc`,
    [orgId, bookingId]
  );
}

export async function assign(orgId: string, bookingId: string, payload: any, user?: RequestUser) {
  const rows = await queryDb(
    `insert into delivery_assignments (
       organization_id, delivery_booking_id, agent_id, vehicle_id, status
     ) values ($1,$2,$3,$4,$5)
     returning *`,
    [
      orgId,
      bookingId,
      payload.agent_id ?? null,
      payload.vehicle_id ?? null,
      payload.status ?? "assigned"
    ]
  );
  return rows[0];
}

export async function addStatus(orgId: string, bookingId: string, status: string, notes?: string) {
  await queryDb(
    `insert into delivery_status_history (organization_id, delivery_booking_id, status, notes)
     values ($1,$2,$3,$4)`,
    [orgId, bookingId, status, notes ?? null]
  );
  await queryDb(
    `update delivery_bookings set status=$3, updated_at=now()
     where organization_id=$1 and id=$2`,
    [orgId, bookingId, status]
  );
}

export async function recordPOD(orgId: string, bookingId: string, payload: any) {
  const rows = await queryDb(
    `insert into proof_of_delivery (
       organization_id, delivery_booking_id, collected_by, signature_url, photo_url, notes
     ) values ($1,$2,$3,$4,$5,$6)
     returning *`,
    [
      orgId,
      bookingId,
      payload.collected_by ?? null,
      payload.signature_url ?? null,
      payload.photo_url ?? null,
      payload.notes ?? null
    ]
  );
  await addStatus(orgId, bookingId, "delivered", "POD recorded");
  return rows[0];
}
