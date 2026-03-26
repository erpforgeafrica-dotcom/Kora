import { queryDb } from "../client.js";

type BookingConfirmationRow = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  confirmation_code: string | null;
  service_name: string | null;
  staff_name: string | null;
  staff_photo_url: string | null;
  venue_name: string | null;
  amount_cents: string | null;
  receipt_url: string | null;
};

type BookingMutationRow = {
  id: string;
  status: string;
};

type BookingNoteRow = {
  id: string;
  notes: string | null;
};

export async function getBookingConfirmation(organizationId: string, bookingId: string) {
  const rows = await queryDb<BookingConfirmationRow>(
    `select b.id::text,
            b.start_time::text,
            b.end_time::text,
            b.status,
            b.confirmation_code,
            s.name as service_name,
            sm.full_name as staff_name,
            sm.photo_url as staff_photo_url,
            vp.display_name as venue_name,
            i.amount_cents::text,
            t.receipt_url
       from bookings b
       left join services s on s.id = b.service_id
       left join staff_members sm on sm.id = b.staff_member_id
       left join venue_profiles vp on vp.organization_id = b.organization_id
       left join invoices i on i.booking_id = b.id
       left join transactions t on t.invoice_id = i.id and t.status = 'succeeded'
      where b.organization_id = $1 and b.id = $2
      limit 1`,
    [organizationId, bookingId]
  );

  const booking = rows[0];
  if (!booking) {
    return null;
  }

  return {
    booking_id: booking.id,
    reference: booking.confirmation_code ?? booking.id.slice(0, 8).toUpperCase(),
    start_time: booking.start_time,
    end_time: booking.end_time,
    status: booking.status,
    service_name: booking.service_name,
    staff_name: booking.staff_name,
    staff_photo_url: booking.staff_photo_url,
    venue_name: booking.venue_name,
    amount_paid: booking.amount_cents ? Number(booking.amount_cents) / 100 : 0,
    receipt_url: booking.receipt_url
  };
}

export async function cancelBooking(organizationId: string, bookingId: string, reason: string | null) {
  const rows = await queryDb<BookingMutationRow>(
    `update bookings
        set status = 'cancelled_client',
            cancellation_reason = coalesce($3, cancellation_reason),
            updated_at = now()
      where organization_id = $1 and id = $2
      returning id::text, status`,
    [organizationId, bookingId, reason]
  );

  return rows[0] ?? null;
}

export async function appendBookingNote(organizationId: string, bookingId: string, note: string) {
  const rows = await queryDb<BookingNoteRow>(
    `update bookings
        set notes = case
          when notes is null or notes = '' then $3
          else notes || E'\\n' || $3
        end,
            updated_at = now()
      where organization_id = $1 and id = $2
      returning id::text, notes`,
    [organizationId, bookingId, note]
  );

  return rows[0] ?? null;
}
