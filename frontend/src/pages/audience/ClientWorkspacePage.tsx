import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getClientLoyalty, getClientProfile } from "../../services/api";
import type { ClientProfile, LoyaltySummary } from "../../types/audience";
import { ActionButton, AudienceMetric, AudienceSection, EmptyState, StatusPill, formatCompactDate, formatMoney } from "../../components/audience/AudiencePrimitives";
import { LoyaltyRingCard } from "../../components/audience/LoyaltyRingCard";
import CheckoutPanel from "../../components/CheckoutPanel";

const MOCK_PROFILE: ClientProfile = {
  id: "demo-client-1",
  full_name: "Amara Stone",
  email: "amara@example.com",
  phone: "+44 7700 900100",
  loyalty_points: 240,
  membership_tier: "silver",
  telehealth_consent: true,
  preferences: { lighting: "dim", music: "low", focus: "recovery" },
  photo_url: null,
  balance_due: 5500,
  upcoming_bookings: [
    {
      id: "appt-1",
      start_time: new Date(Date.now() + 86400000).toISOString(),
      end_time: new Date(Date.now() + 90000000).toISOString(),
      status: "confirmed",
      room: "Room A",
      service: { name: "Deep Tissue Massage" },
      staff: { id: "staff-1", full_name: "Mira Cole", photo_url: null }
    }
  ],
  booking_history: [
    {
      id: "hist-1",
      start_time: new Date(Date.now() - 86400000 * 14).toISOString(),
      end_time: new Date(Date.now() - 86400000 * 14 + 3600000).toISOString(),
      status: "completed",
      room: "Room C",
      service_name: "Sports Recovery",
      staff_name: "Mira Cole"
    }
  ],
  invoices: [{ id: "inv-1", amount_cents: 5500, status: "open", due_date: "2026-03-12" }]
};

const MOCK_LOYALTY: LoyaltySummary = {
  points: 240,
  tier: "silver",
  redemption_history: [
    {
      id: "lt-1",
      type: "earn",
      points: 80,
      balance_after: 240,
      description: "Post-visit reward",
      created_at: new Date(Date.now() - 86400000 * 7).toISOString()
    }
  ]
};

type TabKey = "upcoming" | "history" | "balances" | "telehealth" | "loyalty";

export function ClientWorkspacePage() {
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1440 : window.innerWidth));
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const clientId = localStorage.getItem("kora_client_id");

    async function load() {
      setLoading(true);
      try {
        if (!clientId) {
          setProfile(MOCK_PROFILE);
          setLoyalty(MOCK_LOYALTY);
          setError("Client identity not linked yet. Showing a realistic preview workspace.");
          return;
        }

        const [profileResponse, loyaltyResponse] = await Promise.all([
          getClientProfile(clientId),
          getClientLoyalty(clientId)
        ]);
        setProfile(profileResponse);
        setLoyalty(loyaltyResponse);
        setError(null);
      } catch (err) {
        setProfile(MOCK_PROFILE);
        setLoyalty(MOCK_LOYALTY);
        setError(err instanceof Error ? err.message : "Client portal is temporarily using preview data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const nextTierPoints = useMemo(() => {
    const currentPoints = loyalty?.points ?? 0;
    if ((loyalty?.tier ?? "none") === "silver") return 500;
    if (loyalty?.tier === "gold") return 900;
    if (loyalty?.tier === "platinum") return 1200;
    return Math.max(300, currentPoints + 60);
  }, [loyalty]);

  const isNarrow = width < 980;

  if (loading && !profile) {
    return <div style={{ padding: 24, color: "var(--color-text-muted)" }}>Loading client workspace...</div>;
  }

  if (!profile || !loyalty) {
    return <div style={{ padding: 24, color: "var(--color-danger)" }}>Client workspace unavailable.</div>;
  }

  return (
    <div style={{ padding: isNarrow ? 16 : 24, display: "grid", gap: 16 }}>
      {error ? (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            border: "1px solid color-mix(in srgb, var(--color-warning) 26%, transparent)",
            background: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
            color: "var(--color-warning)",
            fontSize: 14
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "0.95fr 1.35fr", gap: 16 }}>
        <AudienceSection title="Account Profile" meta={profile.membership_tier.toUpperCase()}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 700, color: "var(--color-text-primary)" }}>{profile.full_name}</div>
              <div style={{ marginTop: 6, fontSize: 15, color: "var(--color-text-muted)" }}>{profile.email}</div>
              <div style={{ marginTop: 4, fontSize: 15, color: "var(--color-text-muted)" }}>{profile.phone ?? "Phone not set"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              <AudienceMetric label="Points" value={String(loyalty.points)} tone="var(--color-accent)" />
              <AudienceMetric label="Balance Due" value={formatMoney(profile.balance_due)} tone="var(--color-warning)" />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {Object.entries(profile.preferences).map(([key, value]) => (
                <StatusPill key={key} label={`${key}: ${String(value)}`} tone="muted" />
              ))}
            </div>
            <LoyaltyRingCard
              points={loyalty.points}
              tier={loyalty.tier}
              nextTierPoints={nextTierPoints}
              caption="Your loyalty progress carries into memberships, balances, and future booking rewards."
            />
          </div>
        </AudienceSection>

        <AudienceSection title="Workspace" meta="Customer self-service">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <Link
              to="/app/client/book"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textDecoration: "none",
                border: "1px solid var(--color-accent)",
                background: "var(--color-accent-dim)",
                color: "var(--color-accent)"
              }}
            >
              Book a Service
            </Link>
            {([
              ["upcoming", "Upcoming"],
              ["history", "History"],
              ["balances", "Balances"],
              ["telehealth", "Telehealth"],
              ["loyalty", "Loyalty"]
            ] as Array<[TabKey, string]>).map(([key, label]) => (
              <ActionButton key={key} tone={tab === key ? "accent" : "ghost"} onClick={() => setTab(key)}>
                {label}
              </ActionButton>
            ))}
          </div>

          {tab === "upcoming" ? (
            <div style={{ display: "grid", gap: 12 }}>
              {profile.upcoming_bookings.length ? profile.upcoming_bookings.map((booking) => (
                <div key={booking.id} style={{ padding: 16, borderRadius: 16, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>{booking.service.name}</div>
                      <div style={{ marginTop: 6, fontSize: 14, color: "var(--color-text-muted)" }}>{formatCompactDate(booking.start_time)} · {booking.room ?? "Room pending"}</div>
                      <div style={{ marginTop: 6, fontSize: 14, color: "var(--color-text-secondary)" }}>With {booking.staff.full_name ?? "Staff to be assigned"}</div>
                    </div>
                    <StatusPill label={booking.status} tone="accent" />
                  </div>
                  <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <ActionButton tone="accent">Manage Booking</ActionButton>
                    <ActionButton tone="ghost">What to Expect</ActionButton>
                  </div>
                </div>
              )) : <EmptyState title="No upcoming bookings" detail="Your next session will appear here when a booking is confirmed." />}
            </div>
          ) : null}

          {tab === "history" ? (
            <div style={{ display: "grid", gap: 10 }}>
              {profile.booking_history.map((item) => (
                <div key={item.id} style={{ padding: 14, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>{item.service_name ?? "Service"}</div>
                  <div style={{ marginTop: 6, fontSize: 14, color: "var(--color-text-muted)" }}>{formatCompactDate(item.start_time)} · {item.staff_name ?? "Team"}</div>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "balances" ? (
            <div style={{ display: "grid", gap: 10 }}>
              {profile.invoices.map((invoice) => (
                <div key={invoice.id} style={{ padding: 14, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>{formatMoney(invoice.amount_cents)}</div>
                      <div style={{ marginTop: 6, fontSize: 14, color: "var(--color-text-muted)" }}>Due {invoice.due_date}</div>
                    </div>
                    <StatusPill label={invoice.status} tone={invoice.status === "paid" ? "success" : "warning"} />
                  </div>
                  {invoice.status !== "paid" ? (
                    <div style={{ marginTop: 12 }}>
                      <ActionButton tone="warning" onClick={() => setActiveInvoiceId((current) => (current === invoice.id ? null : invoice.id))}>
                        {activeInvoiceId === invoice.id ? "Hide Checkout" : "Pay Now"}
                      </ActionButton>
                    </div>
                  ) : null}
                  {activeInvoiceId === invoice.id ? (
                    <div style={{ marginTop: 14 }}>
                      <CheckoutPanel
                        amount={invoice.amount_cents / 100}
                        currency="gbp"
                        invoiceId={invoice.id}
                        clientId={profile.id}
                        description={`Invoice ${invoice.id}`}
                        onSuccess={() => {
                          setActiveInvoiceId(null);
                          setError("Payment submitted. Refreshing state depends on the Stripe webhook completing.");
                        }}
                        onError={(message) => setError(message)}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {tab === "telehealth" ? (
            <EmptyState title="Telehealth access stays calm and simple" detail="Your next telehealth session will appear here when an appointment moves into progress." />
          ) : null}

          {tab === "loyalty" ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ padding: 16, borderRadius: 16, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 8 }}>Redemption</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)" }}>Redeem 500 pts for {formatMoney(500)}</div>
              </div>
              {loyalty.redemption_history.map((event) => (
                <div key={event.id} style={{ padding: 14, borderRadius: 14, background: "var(--color-surface-2)", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>{event.description ?? event.type}</div>
                  <div style={{ marginTop: 6, fontSize: 14, color: "var(--color-text-muted)" }}>{event.points > 0 ? "+" : ""}{event.points} pts · {formatCompactDate(event.created_at)}</div>
                </div>
              ))}
            </div>
          ) : null}
        </AudienceSection>
      </div>
    </div>
  );
}
