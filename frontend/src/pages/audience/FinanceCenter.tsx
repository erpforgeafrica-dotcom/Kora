import { useState, useEffect, useCallback } from "react";
import { ActionButton, AudienceSection, StatusPill, EmptyState, AudienceMetric, formatMoney } from "../../components/audience/AudiencePrimitives";
import {
  getFinanceKpis, getInvoices, createInvoice, updateInvoiceStatus, getPayouts,
  type FinanceKpis, type Invoice, type Payout,
} from "../../services/api";

function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fn()); } catch (e: any) { setError(e.message ?? "Failed"); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

type Tab = "dashboard" | "invoices" | "payouts";
type InvoiceFilter = "all" | "pending" | "paid" | "overdue" | "cancelled";

export function FinanceCenter() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>("all");
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ amount_cents: "", due_date: "", client_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const kpis = useApi(() => getFinanceKpis(), []);
  const invoices = useApi(
    () => getInvoices({ status: invoiceFilter === "all" ? undefined : invoiceFilter, limit: 100 }),
    [invoiceFilter]
  );
  const payouts = useApi(() => getPayouts(), []);

  async function handleCreateInvoice() {
    const amount = Number(newInvoice.amount_cents);
    if (!amount || !newInvoice.due_date) return;
    setSubmitting(true);
    try {
      await createInvoice({
        amount_cents: amount,
        due_date: newInvoice.due_date,
        client_id: newInvoice.client_id || undefined,
      });
      setShowNewInvoice(false);
      setNewInvoice({ amount_cents: "", due_date: "", client_id: "" });
      invoices.reload();
      kpis.reload();
    } finally { setSubmitting(false); }
  }

  async function handleStatusChange(id: string, status: string) {
    setUpdatingId(id);
    try {
      await updateInvoiceStatus(id, status);
      invoices.reload();
      kpis.reload();
    } finally { setUpdatingId(null); }
  }

  const k = kpis.data;

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontWeight: 700, textTransform: "uppercase" }}>
          Financial Operations
        </div>
        <div style={{ marginTop: 6, fontSize: 28, fontWeight: 700, color: "var(--color-text-primary)" }}>
          Finance & Cashflow
        </div>
      </div>

      {/* KPIs */}
      {kpis.loading
        ? <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Loading KPIs…</div>
        : kpis.error
          ? <div style={{ fontSize: 13, color: "var(--color-danger)" }}>{kpis.error}</div>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
              <AudienceMetric label="Monthly Revenue" value={formatMoney(k?.revenue_cents ?? 0)} tone="var(--color-success)" />
              <AudienceMetric label="Pending" value={formatMoney(k?.pending_cents ?? 0)} tone="var(--color-warning)" />
              <AudienceMetric label="Overdue" value={String(k?.overdue_count ?? 0)} tone="var(--color-danger)" />
              <AudienceMetric label="Collection Rate" value={`${k?.collection_rate_pct ?? 0}%`} tone="var(--color-accent)" />
            </div>
          )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
        {(["dashboard", "invoices", "payouts"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px", border: "none", background: "transparent", cursor: "pointer",
              color: tab === t ? "var(--color-accent)" : "var(--color-text-muted)",
              fontSize: 13, fontWeight: 600,
              borderBottom: tab === t ? "2px solid var(--color-accent)" : "none",
              marginBottom: -13,
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === "dashboard" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <AudienceSection title="Invoice Summary" meta="This month">
            {kpis.loading
              ? <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Loading…</div>
              : (
                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    { label: "Total Invoices", value: k?.total_invoices ?? 0, color: "var(--color-text-primary)" },
                    { label: "Paid", value: k?.paid_count ?? 0, color: "var(--color-success)" },
                    { label: "Pending", value: k?.pending_count ?? 0, color: "var(--color-warning)" },
                    { label: "Overdue", value: k?.overdue_count ?? 0, color: "var(--color-danger)" },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                      <span style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>{row.label}</span>
                      <span style={{ color: row.color, fontWeight: 700, fontSize: 13 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
          </AudienceSection>

          <AudienceSection title="Collection Rate" meta="Paid vs total billed">
            {kpis.loading
              ? <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Loading…</div>
              : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ height: 12, background: "var(--color-surface-2)", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${k?.collection_rate_pct ?? 0}%`, background: "linear-gradient(90deg,var(--color-accent),var(--color-success))" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>{k?.collection_rate_pct ?? 0}% collected</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{formatMoney(k?.revenue_cents ?? 0)} received</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Overdue exposure</span>
                    <span style={{ color: "var(--color-danger)", fontWeight: 700 }}>{formatMoney(k?.overdue_cents ?? 0)}</span>
                  </div>
                </div>
              )}
          </AudienceSection>
        </div>
      )}

      {/* Invoices tab */}
      {tab === "invoices" && (
        <AudienceSection title="Invoice Management" meta={`${invoices.data?.count ?? 0} invoices`}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["all", "pending", "paid", "overdue", "cancelled"] as InvoiceFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setInvoiceFilter(f)}
                  style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: invoiceFilter === f ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                    background: invoiceFilter === f ? "var(--color-accent-dim)" : "transparent",
                    color: invoiceFilter === f ? "var(--color-accent)" : "var(--color-text-muted)",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
            <ActionButton tone="accent" onClick={() => setShowNewInvoice(v => !v)}>+ New Invoice</ActionButton>
          </div>

          {showNewInvoice && (
            <div style={{ padding: 16, background: "var(--color-surface-2)", borderRadius: 10, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Amount (pence) *", key: "amount_cents", placeholder: "e.g. 15000" },
                { label: "Due Date *", key: "due_date", placeholder: "YYYY-MM-DD" },
                { label: "Client ID (optional)", key: "client_id", placeholder: "UUID" },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>{f.label}</div>
                  <input
                    value={(newInvoice as any)[f.key]}
                    onChange={e => setNewInvoice(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--color-border)", background: "var(--color-surface-1)", color: "var(--color-text-primary)", fontSize: 13 }}
                  />
                </div>
              ))}
              <div style={{ gridColumn: "1/-1", display: "flex", gap: 8 }}>
                <ActionButton tone="accent" onClick={handleCreateInvoice} disabled={submitting || !newInvoice.amount_cents || !newInvoice.due_date}>
                  {submitting ? "Creating…" : "Create Invoice"}
                </ActionButton>
                <ActionButton tone="ghost" onClick={() => setShowNewInvoice(false)}>Cancel</ActionButton>
              </div>
            </div>
          )}

          {invoices.loading && <div style={{ padding: 16, color: "var(--color-text-muted)" }}>Loading…</div>}
          {invoices.error && <div style={{ padding: 16, color: "var(--color-danger)" }}>{invoices.error}</div>}

          {!invoices.loading && invoices.data?.count === 0 && (
            <EmptyState title="No invoices" detail={`No ${invoiceFilter === "all" ? "" : invoiceFilter} invoices found.`} />
          )}

          {invoices.data && invoices.data.count > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["Client", "Amount", "Due Date", "Status", "Actions"].map(h => (
                      <th key={h} style={{ textAlign: h === "Amount" ? "right" : "left", padding: "10px 8px", color: "var(--color-text-muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.data.invoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px 8px", color: "var(--color-text-primary)" }}>
                        {inv.client_name ?? <span style={{ color: "var(--color-text-muted)" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {formatMoney(inv.amount_cents)}
                      </td>
                      <td style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: 12 }}>
                        {new Date(inv.due_date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <StatusPill
                          label={inv.status}
                          tone={inv.status === "paid" ? "success" : inv.status === "overdue" ? "danger" : inv.status === "cancelled" ? "muted" : "warning"}
                        />
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        {inv.status === "pending" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <ActionButton
                              tone="accent"
                              onClick={() => handleStatusChange(inv.id, "paid")}
                              disabled={updatingId === inv.id}
                            >
                              Mark Paid
                            </ActionButton>
                            <ActionButton
                              tone="ghost"
                              onClick={() => handleStatusChange(inv.id, "overdue")}
                              disabled={updatingId === inv.id}
                            >
                              Overdue
                            </ActionButton>
                          </div>
                        )}
                        {inv.status === "overdue" && (
                          <ActionButton
                            tone="accent"
                            onClick={() => handleStatusChange(inv.id, "paid")}
                            disabled={updatingId === inv.id}
                          >
                            {updatingId === inv.id ? "Updating…" : "Mark Paid"}
                          </ActionButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AudienceSection>
      )}

      {/* Payouts tab */}
      {tab === "payouts" && (
        <AudienceSection title="Staff Payouts" meta={`${payouts.data?.count ?? 0} records`}>
          {payouts.loading && <div style={{ padding: 16, color: "var(--color-text-muted)" }}>Loading…</div>}
          {payouts.error && <div style={{ padding: 16, color: "var(--color-danger)" }}>{payouts.error}</div>}
          {!payouts.loading && payouts.data?.count === 0 && (
            <EmptyState title="No payouts" detail="No payout records found for this organisation." />
          )}
          {payouts.data && payouts.data.count > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["Staff", "Period", "Gross", "Commission", "Net", "Status"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 8px", color: "var(--color-text-muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payouts.data.payouts.map(p => (
                    <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px 8px", color: "var(--color-text-primary)", fontWeight: 600 }}>{p.staff_name ?? "—"}</td>
                      <td style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: 12 }}>
                        {p.period_start} → {p.period_end}
                      </td>
                      <td style={{ padding: "12px 8px", color: "var(--color-text-primary)" }}>{formatMoney(p.gross_amount_cents)}</td>
                      <td style={{ padding: "12px 8px", color: "var(--color-text-muted)" }}>
                        {p.commission_rate ? `${p.commission_rate}%` : "—"}
                      </td>
                      <td style={{ padding: "12px 8px", fontWeight: 700, color: "var(--color-success)" }}>{formatMoney(p.net_amount_cents)}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <StatusPill label={p.status} tone={p.status === "paid" ? "success" : "warning"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AudienceSection>
      )}
    </div>
  );
}
