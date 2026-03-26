import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createBooking,
  getTeamAvailability,
  getVenueProfile,
  getVenueServices,
  type AvailabilitySlot,
  type VenueProfile,
  type VenueService
} from "../../services/api";
import { ActionButton, AudienceSection, EmptyState, formatMoney } from "../../components/audience/AudiencePrimitives";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function VenueDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<VenueProfile | null>(null);
  const [services, setServices] = useState<VenueService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadVenue() {
      setLoading(true);
      setError(null);
      try {
        const [venueResponse, servicesResponse] = await Promise.all([getVenueProfile(slug), getVenueServices(slug)]);
        if (cancelled) {
          return;
        }
        setVenue(venueResponse);
        setServices(servicesResponse.services);
        if (servicesResponse.services[0]) {
          setSelectedServiceId(servicesResponse.services[0].id);
        }
      } catch {
        if (!cancelled) {
          setError("Venue details are unavailable right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadVenue();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectedService = useMemo(() => services.find((service) => service.id === selectedServiceId) ?? null, [services, selectedServiceId]);

  useEffect(() => {
    let cancelled = false;
    async function loadAvailability() {
      if (!selectedService) {
        setSlots([]);
        return;
      }
      try {
        const response = await getTeamAvailability({ serviceId: selectedService.id, date: selectedDate });
        if (!cancelled) {
          setSlots(response.availability.flatMap((entry) => entry.slots));
          setSelectedSlot(null);
        }
      } catch {
        if (!cancelled) {
          setError("Live availability is unavailable. Try a different date in a moment.");
        }
      }
    }

    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [selectedService, selectedDate]);

  async function handleConfirm() {
    if (!selectedService || !selectedSlot) {
      return;
    }

    setBooking(true);
    setError(null);
    try {
      const bookingResponse = await createBooking({
        service_id: selectedService.id,
        staff_member_id: selectedSlot.staff_id,
        room_id: selectedSlot.room_id,
        start_time: `${selectedDate}T${selectedSlot.start_time}:00.000Z`,
        source: "web"
      });

      const bookingId =
        typeof bookingResponse === "object" && bookingResponse && "id" in bookingResponse
          ? String((bookingResponse as { id: string }).id)
          : "";

      if (!bookingId) {
        throw new Error("missing_booking_id");
      }

      navigate(`/app/booking/confirmed/${bookingId}`);
    } catch {
      setError("Booking could not be confirmed. Try another slot.");
    } finally {
      setBooking(false);
    }
  }

  const dates = Array.from({ length: 7 }, (_, index) => {
    const value = new Date(Date.now() + index * 86400000);
    return value.toISOString().slice(0, 10);
  });

  if (loading) {
    return <div style={{ padding: 24, color: "var(--color-text-muted)" }}>Loading venue...</div>;
  }

  if (error && !venue) {
    return (
      <div style={{ padding: 24 }}>
        <EmptyState title="Venue unavailable" detail={error} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
            Venue Booking
          </div>
          <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>{venue?.display_name ?? "Venue"}</div>
          <div style={{ marginTop: 6, fontSize: 14, color: "var(--color-text-muted)" }}>
            {venue?.city} · {venue?.rating.toFixed(1)} rating · {venue?.review_count} reviews
          </div>
        </div>
        <Link to="/app/client/book" style={{ color: "var(--color-accent)", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
          Back to search
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)", gap: 16 }}>
        <AudienceSection title="Services" meta={venue?.tagline ?? "Pick a service"}>
          <div style={{ display: "grid", gap: 12 }}>
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedServiceId(service.id)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  textAlign: "left",
                  border: selectedServiceId === service.id ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  background: selectedServiceId === service.id ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>{service.name}</div>
                    <div style={{ marginTop: 6, fontSize: 14, color: "var(--color-text-secondary)" }}>{service.description ?? "No description yet."}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
                      {formatMoney(Math.round(service.price * 100))}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "var(--color-text-muted)" }}>{service.duration_minutes} mins</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </AudienceSection>

        <AudienceSection title="Availability" meta={selectedService?.name ?? "Choose service"}>
          {selectedService ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {dates.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: selectedDate === date ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                      background: selectedDate === date ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                      color: selectedDate === date ? "var(--color-accent)" : "var(--color-text-secondary)",
                      cursor: "pointer"
                    }}
                  >
                    {date}
                  </button>
                ))}
              </div>

              {slots.length === 0 ? (
                <EmptyState title="No live slots" detail="No slots are currently open for this date. Try another day or wait for new availability." />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                  {slots.map((slot) => {
                    const key = `${slot.staff_id}-${slot.start_time}`;
                    const selected = selectedSlot?.staff_id === slot.staff_id && selectedSlot?.start_time === slot.start_time;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: 14,
                          borderRadius: 14,
                          border: selected ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                          background: selected ? "var(--color-accent-dim)" : "var(--color-surface-2)",
                          color: "var(--color-text-primary)",
                          cursor: "pointer"
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 700 }}>{slot.start_time}</div>
                        <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-text-muted)" }}>Staff {slot.staff_id.slice(0, 6)}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {error ? <div style={{ fontSize: 13, color: "var(--color-warning)" }}>{error}</div> : null}

              <ActionButton tone="accent" onClick={handleConfirm} disabled={!selectedSlot || booking}>
                {booking ? "Confirming..." : "Confirm booking"}
              </ActionButton>
            </div>
          ) : (
            <EmptyState title="Choose a service" detail="Availability loads when a service is selected." />
          )}
        </AudienceSection>
      </div>
    </div>
  );
}
