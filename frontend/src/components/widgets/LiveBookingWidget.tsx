import { useEffect, useState } from "react";

interface BookingStatus {
  active: number;
  completed: number;
  pending: number;
  cancelled: number;
}

export function LiveBookingWidget() {
  const [bookings, setBookings] = useState<BookingStatus>({
    active: 12,
    completed: 47,
    pending: 8,
    cancelled: 2
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setBookings((prev) => ({
        ...prev,
        active: Math.max(1, prev.active + Math.floor(Math.random() * 3 - 1)),
        completed: prev.completed + Math.floor(Math.random() * 2),
        pending: Math.max(0, prev.pending + Math.floor(Math.random() * 2 - 1))
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const total = bookings.active + bookings.completed + bookings.pending + bookings.cancelled;

  return (
    <div
      style={{
        padding: "clamp(16px, 4vw, 20px)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: "clamp(12px, 3vw, 16px)"
      }}
    >
      <div>
        <div
          style={{
            fontSize: "clamp(9px, 1.8vw, 10px)",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.12em",
            color: "var(--color-text-muted)",
            fontWeight: 700,
            marginBottom: 4
          }}
        >
          BOOKINGS
        </div>
        <h3 style={{ margin: 0, fontSize: "clamp(20px, 5vw, 28px)", color: "var(--color-text-primary)" }}>
          {total} Total
        </h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "clamp(8px, 2vw, 12px)"
        }}
      >
        <div
          style={{
            padding: "clamp(8px, 2vw, 12px)",
            background: "var(--color-surface-2)",
            borderRadius: 8,
            borderLeft: "3px solid #4a9eff"
          }}
        >
          <div style={{ fontSize: "clamp(9px, 1.8vw, 10px)", color: "var(--color-text-muted)" }}>Active</div>
          <div style={{ fontSize: "clamp(14px, 3vw, 18px)", fontWeight: 700, color: "#4a9eff", marginTop: 4 }}>
            {bookings.active}
          </div>
        </div>

        <div
          style={{
            padding: "clamp(8px, 2vw, 12px)",
            background: "var(--color-surface-2)",
            borderRadius: 8,
            borderLeft: "3px solid var(--color-success)"
          }}
        >
          <div style={{ fontSize: "clamp(9px, 1.8vw, 10px)", color: "var(--color-text-muted)" }}>Completed</div>
          <div style={{ fontSize: "clamp(14px, 3vw, 18px)", fontWeight: 700, color: "var(--color-success)", marginTop: 4 }}>
            {bookings.completed}
          </div>
        </div>

        <div
          style={{
            padding: "clamp(8px, 2vw, 12px)",
            background: "var(--color-surface-2)",
            borderRadius: 8,
            borderLeft: "3px solid var(--color-warning)"
          }}
        >
          <div style={{ fontSize: "clamp(9px, 1.8vw, 10px)", color: "var(--color-text-muted)" }}>Pending</div>
          <div style={{ fontSize: "clamp(14px, 3vw, 18px)", fontWeight: 700, color: "var(--color-warning)", marginTop: 4 }}>
            {bookings.pending}
          </div>
        </div>

        <div
          style={{
            padding: "clamp(8px, 2vw, 12px)",
            background: "var(--color-surface-2)",
            borderRadius: 8,
            borderLeft: "3px solid var(--color-danger)"
          }}
        >
          <div style={{ fontSize: "clamp(9px, 1.8vw, 10px)", color: "var(--color-text-muted)" }}>Cancelled</div>
          <div style={{ fontSize: "clamp(14px, 3vw, 18px)", fontWeight: 700, color: "var(--color-danger)", marginTop: 4 }}>
            {bookings.cancelled}
          </div>
        </div>
      </div>

      <div
        style={{
          height: 8,
          background: "var(--color-surface-2)",
          borderRadius: 4,
          overflow: "hidden",
          display: "flex"
        }}
      >
        <div
          style={{
            flex: bookings.active,
            background: "#4a9eff",
            transition: "flex 400ms ease"
          }}
        />
        <div
          style={{
            flex: bookings.completed,
            background: "var(--color-success)",
            transition: "flex 400ms ease"
          }}
        />
        <div
          style={{
            flex: bookings.pending,
            background: "var(--color-warning)",
            transition: "flex 400ms ease"
          }}
        />
        <div
          style={{
            flex: bookings.cancelled,
            background: "var(--color-danger)",
            transition: "flex 400ms ease"
          }}
        />
      </div>
    </div>
  );
}
