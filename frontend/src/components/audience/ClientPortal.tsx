import { useState, useEffect } from "react";
import type {
  ClientProfile,
  Appointment,
  Invoice,
  LoyaltyEvent,
  Transaction
} from "../types/audience";
import { LoyaltyWidget } from "./LoyaltyWidget";

type TabType = "upcoming" | "history" | "membership" | "balances" | "telehealth";

interface ClientPortalProps {
  clientId?: string;
}

// MOCK DATA — will be replaced by API calls to GET /api/clients/:id
const MOCK_CLIENT: ClientProfile = {
  id: "client_123",
  org_id: "org_456",
  email: "sarah@example.com",
  full_name: "Sarah Mitchell",
  phone: "+44 20 7123 4567",
  preferred_staff_id: "staff_001",
  loyalty_points: 240,
  membership_tier: "gold",
  telehealth_consent: true,
  created_at: "2025-01-15T08:00:00Z",
  updated_at: "2026-03-06T11:00:00Z"
};

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "apt_001",
    client_id: "client_123",
    staff_id: "staff_001",
    service_id: "svc_001",
    start_time: "2026-03-10T14:00:00Z",
    end_time: "2026-03-10T15:00:00Z",
    room: "Room A",
    status: "confirmed",
    notes: null,
    client: {
      id: "client_123",
      name: "Sarah Mitchell",
      phone: "+44 20 7123 4567",
      photo_url: "https://img.placeholder.com/48",
      preferences: ["No pressure on temples", "Prefers cool water"]
    },
    service: {
      id: "svc_001",
      name: "Balayage Highlights",
      duration_minutes: 120,
      price: 85.00,
      currency: "GBP"
    },
    staff: {
      id: "staff_001",
      name: "Emma's Hair Studio",
      role: "therapist",
      photo_url: "https://img.placeholder.com/48",
      rating: 4.8
    }
  },
  {
    id: "apt_002",
    client_id: "client_123",
    staff_id: "staff_002",
    service_id: "svc_002",
    start_time: "2026-03-15T10:00:00Z",
    end_time: "2026-03-15T11:00:00Z",
    room: "Room B",
    status: "confirmed",
    notes: null,
    client: {
      id: "client_123",
      name: "Sarah Mitchell",
      phone: "+44 20 7123 4567",
      photo_url: "https://img.placeholder.com/48",
      preferences: []
    },
    service: {
      id: "svc_002",
      name: "Swedish Massage",
      duration_minutes: 60,
      price: 55.00,
      currency: "GBP"
    },
    staff: {
      id: "staff_002",
      name: "James Massage Therapy",
      role: "therapist",
      photo_url: "https://img.placeholder.com/48",
      rating: 4.9
    }
  }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv_001",
    client_id: "client_123",
    org_id: "org_456",
    amount: 120.00,
    outstanding_balance: 120.00,
    due_date: "2026-03-20",
    created_at: "2026-03-06T08:00:00Z",
    status: "issued",
    line_items: [
      { description: "Balayage Highlights", quantity: 1, unit_price: 85.00, amount: 85.00 },
      { description: "Toner Treatment", quantity: 1, unit_price: 35.00, amount: 35.00 }
    ]
  }
];

const MOCK_LOYALTY_EVENTS: LoyaltyEvent[] = [
  {
    id: "evt_001",
    client_id: "client_123",
    org_id: "org_456",
    amount: 120,
    event_type: "earned",
    description: "Earned from visit on 2026-03-01",
    created_at: "2026-03-01T15:30:00Z",
    appointment_id: "apt_000"
  },
  {
    id: "evt_002",
    client_id: "client_123",
    org_id: "org_456",
    amount: 50,
    event_type: "redeemed",
    description: "Redeemed for £2.50 discount",
    created_at: "2026-02-28T10:00:00Z",
    appointment_id: null
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "txn_001",
    client_id: "client_123",
    org_id: "org_456",
    amount: 85.00,
    currency: "GBP",
    status: "completed",
    method: "card",
    created_at: "2026-03-01T15:45:00Z",
    invoice_id: "inv_000",
    receipt_url: "https://receipts.example.com/rec_001.pdf"
  },
  {
    id: "txn_002",
    client_id: "client_123",
    org_id: "org_456",
    amount: 55.00,
    currency: "GBP",
    status: "completed",
    method: "card",
    created_at: "2026-02-21T11:30:00Z",
    invoice_id: "inv_002",
    receipt_url: "https://receipts.example.com/rec_002.pdf"
  }
];

export function ClientPortal({ clientId }: ClientPortalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In production, fetch from API
  const client = MOCK_CLIENT;
  const appointments = MOCK_APPOINTMENTS;
  const invoices = MOCK_INVOICES;
  const loyaltyEvents = MOCK_LOYALTY_EVENTS;
  const transactions = MOCK_TRANSACTIONS;

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: "upcoming", label: "Upcoming", icon: "📅" },
    { id: "history", label: "History", icon: "📜" },
    { id: "membership", label: "Membership", icon: "⭐" },
    { id: "balances", label: "Balances", icon: "💳" },
    { id: "telehealth", label: "Telehealth", icon: "📹" }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: 24,
        height: "100%",
        overflow: "hidden"
      }}
    >
      {/* Left Panel — Profile & Loyalty Widget */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          paddingRight: 20,
          borderRight: "1px solid var(--color-border)",
          overflowY: "auto"
        }}
      >
        {/* Profile Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: 16,
            background: "var(--color-background-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 16
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: `linear-gradient(135deg, var(--color-accent-teal), var(--color-accent-orange))`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "white"
            }}
          >
            {client.full_name.charAt(0)}
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>
              {client.full_name}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
              {client.email}
            </div>
          </div>
        </div>

        {/* Loyalty Widget */}
        <LoyaltyWidget
          points={client.loyalty_points}
          tier={client.membership_tier}
          nextTierPoints={500}
          onRedeemClick={() => setActiveTab("membership")}
        />

        {/* Quick Actions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <button
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              border: "1px solid var(--color-accent-teal)",
              background: "rgba(0,229,200,0.1)",
              color: "var(--color-accent-teal)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textTransform: "uppercase"
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "rgba(0,229,200,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "rgba(0,229,200,0.1)";
            }}
          >
            Book Now →
          </button>
          <button
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "var(--color-text-secondary)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textTransform: "uppercase"
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.borderColor = "var(--color-border)";
              (e.target as HTMLElement).style.color = "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
              (e.target as HTMLElement).style.color = "var(--color-text-secondary)";
            }}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Right Panel — Tab Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          overflow: "hidden"
        }}
      >
        {/* Tab Selector */}
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: 16,
            marginBottom: 20,
            overflow: "x-auto"
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "none",
                background: activeTab === tab.id ? "rgba(0,229,200,0.1)" : "transparent",
                color: activeTab === tab.id ? "var(--color-accent-teal)" : "var(--color-text-secondary)",
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                letterSpacing: "0.06em",
                borderBottom: activeTab === tab.id ? "2px solid var(--color-accent-teal)" : "2px solid transparent"
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {activeTab === "upcoming" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {appointments.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "var(--color-text-secondary)"
                  }}
                >
                  <div style={{ fontSize: 14, marginBottom: 8 }}>No upcoming appointments</div>
                  <button style={{ color: "var(--color-accent-teal)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}>
                    Book your next visit →
                  </button>
                </div>
              ) : (
                appointments.map((apt) => (
                  <div
                    key={apt.id}
                    style={{
                      padding: 16,
                      background: "var(--color-background-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 14,
                      display: "flex",
                      gap: 14,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent-teal)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(0,229,200,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                      (e.currentTarget as HTMLElement).style.background = "var(--color-background-card)";
                    }}
                  >
                    {/* Staff Avatar */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "var(--color-accent-orange)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 700,
                        color: "white",
                        flexShrink: 0
                      }}
                    >
                      {apt.staff.name.charAt(0)}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {apt.service.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                        with {apt.staff.name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 4 }}>
                        🕐 {new Date(apt.start_time).toLocaleString()} • {apt.room}
                      </div>
                    </div>

                    {/* Status & Price */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 6,
                        flexShrink: 0
                      }}
                    >
                      <div
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: "rgba(0,229,200,0.15)",
                          color: "var(--color-accent-teal)",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase"
                        }}
                      >
                        {apt.status}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>
                        £{apt.service.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                Past appointments and completed services
              </div>
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                  background: "var(--color-background-card)",
                  borderRadius: 14,
                  border: "1px solid var(--color-border)"
                }}
              >
                No history available yet
              </div>
            </div>
          )}

          {activeTab === "membership" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  padding: 16,
                  background: "rgba(0,229,200,0.08)",
                  border: "1px solid rgba(0,229,200,0.2)",
                  borderRadius: 14
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-accent-teal)", marginBottom: 8 }}>
                  CURRENT STATUS
                </div>
                <div style={{ fontSize: 14, color: "var(--color-text-primary)" }}>
                  You are {client.loyalty_points} points away from Platinum status
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 6 }}>
                  Unlock exclusive benefits: priority booking, premium services, personal stylist access
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  RECENT ACTIVITY
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {loyaltyEvents.map((evt) => (
                    <div
                      key={evt.id}
                      style={{
                        padding: 12,
                        background: "var(--color-background-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 10,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, color: "var(--color-text-primary)" }}>
                          {evt.description}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                          {new Date(evt.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: evt.event_type === "earned" ? "var(--color-success)" : "var(--color-warning)"
                        }}
                      >
                        {evt.event_type === "earned" ? "+" : "-"}{evt.amount} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "balances" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {invoices.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
                    OUTSTANDING INVOICES
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {invoices.map((inv) => (
                      <div
                        key={inv.id}
                        style={{
                          padding: 14,
                          background: "var(--color-background-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 10,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)" }}>
                            Invoice {inv.id}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                            Due {new Date(inv.due_date).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          style={{
                            padding: "8px 12px",
                            borderRadius: 8,
                            border: "1px solid var(--color-accent-teal)",
                            background: "rgba(0,229,200,0.1)",
                            color: "var(--color-accent-teal)",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            letterSpacing: "0.06em"
                          }}
                        >
                          Pay £{inv.outstanding_balance.toFixed(2)}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>
                  PAYMENT HISTORY
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {transactions.map((txn) => (
                    <div
                      key={txn.id}
                      style={{
                        padding: 10,
                        background: "var(--color-background-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12
                      }}
                    >
                      <div>
                        <div style={{ color: "var(--color-text-primary)" }}>
                          {txn.method === "card" ? "💳" : txn.method === "cash" ? "💵" : "📋"} {txn.method.toUpperCase()}
                        </div>
                        <div style={{ color: "var(--color-text-tertiary)", fontSize: 10, marginTop: 2 }}>
                          {new Date(txn.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--color-success)" }}>
                        £{txn.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "telehealth" && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              {client.telehealth_consent ? (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📹</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 6 }}>
                    Ready for Telehealth
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 16 }}>
                    Your next eligible appointment will show a "Join Session" button
                  </div>
                  <button
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid var(--color-accent-teal)",
                      background: "rgba(0,229,200,0.1)",
                      color: "var(--color-accent-teal)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    View Settings
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 6 }}>
                    Telehealth Not Enabled
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 16 }}>
                    Opt in to telehealth sessions to join video appointments
                  </div>
                  <button
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: "1px solid var(--color-accent-teal)",
                      background: "rgba(0,229,200,0.1)",
                      color: "var(--color-accent-teal)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Enable Telehealth
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
