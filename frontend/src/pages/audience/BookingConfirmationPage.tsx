import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBookingConfirmation, type BookingConfirmationPayload } from "../../services/api";
import { AudienceSection } from "../../components/audience/AudiencePrimitives";

export function BookingConfirmationPage() {
  const { bookingId = "" } = useParams();
  const [booking, setBooking] = useState<BookingConfirmationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await getBookingConfirmation(bookingId);
        if (!cancelled) {
          setBooking(response);
        }
      } catch {
        if (!cancelled) {
          setError("Booking confirmation is unavailable. Check your client workspace shortly.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto", display: "grid", gap: 16 }}>
      <AudienceSection title="Booking Confirmed" meta="Live booking reference">
        {booking ? (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: "var(--color-accent)" }}>{booking.reference}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>{booking.service_name}</div>
            <div style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
              {booking.venue_name} · {booking.staff_name} · {new Date(booking.start_time).toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Payment collected now: {booking.amount_paid > 0 ? booking.amount_paid.toFixed(2) : "0.00"}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>{error ?? "Loading confirmation..."}</div>
        )}
      </AudienceSection>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link to="/app/client/book" style={{ color: "var(--color-accent)", fontWeight: 700, textDecoration: "none" }}>
          Book another service
        </Link>
        <Link to="/app/client" style={{ color: "var(--color-accent)", fontWeight: 700, textDecoration: "none" }}>
          View client workspace
        </Link>
      </div>
    </div>
  );
}
