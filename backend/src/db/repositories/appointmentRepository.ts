import { dbPool, queryDb } from "../client.js";

export async function listAppointmentsForDate(organizationId: string, date: string) {
  return queryDb<{
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    room_id: string | null;
    room: string | null;
    staff_member_id: string;
    staff_name: string;
    client_id: string | null;
    client_name: string | null;
    service_id: string | null;
    service_name: string | null;
    notes: string | null;
  }>(
    `select b.id::text,
            b.start_time::text,
            b.end_time::text,
            b.status,
            b.room_id::text,
            coalesce(rr.name, b.room) as room,
            b.staff_member_id::text,
            sm.full_name as staff_name,
            b.client_id::text,
            c.full_name as client_name,
            b.service_id::text,
            s.name as service_name,
            b.notes
       from bookings b
       join staff_members sm on sm.id = b.staff_member_id
       left join clients c on c.id = b.client_id
       left join services s on s.id = b.service_id
       left join rooms_resources rr on rr.id = b.room_id
      where b.organization_id = $1
        and date(b.start_time at time zone 'utc') = $2::date
      order by b.start_time asc`,
    [organizationId, date]
  );
}

export async function getAppointmentCore(organizationId: string, appointmentId: string) {
  const rows = await queryDb<{
    start_time: string;
    end_time: string;
    staff_member_id: string;
  }>(
    `select start_time::text, end_time::text, staff_member_id::text
       from bookings
      where organization_id = $1 and id = $2
      limit 1`,
    [organizationId, appointmentId]
  );

  return rows[0] ?? null;
}

export async function findAppointmentConflict(params: {
  organizationId: string;
  appointmentId: string;
  staffMemberId: string;
  startIso: string;
  endIso: string;
}) {
  const rows = await queryDb<{ id: string }>(
    `select id::text
       from bookings
      where organization_id = $1
        and id <> $2
        and staff_member_id = $3
        and status not in ('cancelled', 'cancelled_client', 'cancelled_staff', 'no_show')
        and tstzrange(start_time, end_time, '[)') && tstzrange($4::timestamptz, $5::timestamptz, '[)')
      limit 1`,
    [params.organizationId, params.appointmentId, params.staffMemberId, params.startIso, params.endIso]
  );

  return rows[0] ?? null;
}

export async function updateAppointmentRecord(params: {
  organizationId: string;
  appointmentId: string;
  startIso: string;
  endIso: string;
  staffMemberId: string;
  roomId: string | null;
  status: string | null;
  actorExternalId: string | null;
}) {
  const client = await dbPool.connect();
  try {
    await client.query("begin");

    const updatedRows = await client.query<{
      id: string;
      start_time: string;
      end_time: string;
      status: string;
      staff_member_id: string;
      room_id: string | null;
    }>(
      `update bookings
          set start_time = $3,
              end_time = $4,
              staff_member_id = $5,
              room_id = $6,
              status = coalesce($7, status),
              updated_at = now()
        where organization_id = $1 and id = $2
        returning id::text, start_time::text, end_time::text, status, staff_member_id::text, room_id::text`,
      [
        params.organizationId,
        params.appointmentId,
        params.startIso,
        params.endIso,
        params.staffMemberId,
        params.roomId,
        params.status
      ]
    );

    await client.query(
      `insert into audit_logs (id, organization_id, actor_id, action, metadata)
       values (gen_random_uuid(), $1, null, 'appointment.updated', $2::jsonb)`,
      [params.organizationId, JSON.stringify({ appointment_id: params.appointmentId, actor_external_id: params.actorExternalId })]
    );

    await client.query("commit");
    return updatedRows.rows[0] ?? null;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
