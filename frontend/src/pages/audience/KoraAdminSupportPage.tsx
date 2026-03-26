import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSupportDashboardSummary, listSupportCases, type SupportCaseRecord } from "../../services/api";

type LoadState = "idle" | "loading" | "error" | "ready";
type SupportView = "queue" | "escalations" | "resolved";
type PriorityLevel = "critical" | "high" | "medium" | "low";

interface SupportRow extends SupportCaseRecord {
  priority: PriorityLevel;
  supportStatus: "open" | "triage" | "resolved";
  organization: string;
  assignee: string;
  ageHours: number;
  slaState: "healthy" | "at-risk" | "breached";
}

const FILTERS: Array<{ label: string; value: SupportView }> = [
  { label: "Support Queue", value: "queue" },
  { label: "Escalations", value: "escalations" },
  { label: "Resolved Tickets", value: "resolved" }
];

function getView(search: string): SupportView {
  const value = new URLSearchParams(search).get("view");
  if (value === "queue" || value === "escalations" || value === "resolved") {
    return value;
  }
  return "queue";
}

function formatDate(value: string | null) {
  if (!value) return "Awaiting dispatch";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function derivePriority(ticket: SupportCaseRecord): PriorityLevel {
  return ticket.priority;
}

function deriveSupportStatus(ticket: SupportCaseRecord): SupportRow["supportStatus"] {
  const status = ticket.status.toLowerCase();
  if (status.includes("sent") || status.includes("resolved") || status.includes("closed") || status.includes("delivered")) return "resolved";
  if (
    status.includes("pending") ||
    status.includes("queued") ||
    status.includes("processing") ||
    status.includes("assigned") ||
    status.includes("in_progress") ||
    status.includes("escalated")
  ) {
    return "triage";
  }
  return "open";
}

function deriveAssignee(ticket: SupportCaseRecord) {
  if (ticket.assignee_name?.trim()) return ticket.assignee_name;
  if (ticket.status === "escalated") return "Escalation Lead";
  return "Unassigned";
}

function getSlaState(ageHours: number, supportStatus: SupportRow["supportStatus"]): SupportRow["slaState"] {
  if (supportStatus === "resolved") return "healthy";
  if (ageHours >= 12) return "breached";
  if (ageHours >= 6) return "at-risk";
  return "healthy";
}

function getPriorityStyles(priority: PriorityLevel) {
  const palette: Record<PriorityLevel, { color: string; background: string; border: string }> = {
    critical: {
      color: "#ffd6db",
      background: "rgba(239, 68, 68, 0.14)",
      border: "rgba(239, 68, 68, 0.32)"
    },
    high: {
      color: "#ffe6c0",
      background: "rgba(245, 158, 11, 0.14)",
      border: "rgba(245, 158, 11, 0.28)"
    },
    medium: {
      color: "#d9f8ef",
      background: "rgba(0, 229, 200, 0.12)",
      border: "rgba(0, 229, 200, 0.24)"
    },
    low: {
      color: "var(--color-text-secondary)",
      background: "rgba(126, 143, 181, 0.12)",
      border: "rgba(126, 143, 181, 0.22)"
    }
  };

  return palette[priority];
}

function getStatusStyles(status: SupportRow["supportStatus"]) {
  const palette = {
    open: {
      color: "#ffd6db",
      background: "rgba(239, 68, 68, 0.12)",
      border: "rgba(239, 68, 68, 0.22)"
    },
    triage: {
      color: "#ddf7ef",
      background: "rgba(0, 229, 200, 0.12)",
      border: "rgba(0, 229, 200, 0.22)"
    },
    resolved: {
      color: "#d6f9df",
      background: "rgba(34, 197, 94, 0.12)",
      border: "rgba(34, 197, 94, 0.24)"
    }
  };

  return palette[status];
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "110px minmax(0, 1fr)",
        gap: 12,
        alignItems: "start"
      }}
    >
      <div style={{ fontSize: 11, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{value}</div>
    </div>
  );
}

export default function KoraAdminSupportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState<SupportCaseRecord[]>([]);
  const [summary, setSummary] = useState<Array<{ status: string; count: number }>>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | SupportRow["supportStatus"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | PriorityLevel>("all");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const view = useMemo(() => getView(location.search), [location.search]);
  const orgName = localStorage.getItem("kora_org_name") ?? "Demo Organization";

  const refresh = async () => {
    setState("loading");
    setError(null);

    try {
      const [cases, dashboardSummary] = await Promise.all([
        listSupportCases({ limit: 80, sort: "created_at:desc" }),
        getSupportDashboardSummary().catch(() => []),
      ]);
      setTickets(cases ?? []);
      setSummary(dashboardSummary ?? []);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load support queue");
      setState("error");
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const normalizedTickets = useMemo<SupportRow[]>(() => {
    const now = Date.now();

    return tickets.map((ticket) => {
      const createdAt = new Date(ticket.created_at).getTime();
      const ageHours = Number.isFinite(createdAt) ? Math.max(0, Math.round((now - createdAt) / 36e5)) : 0;
      const supportStatus = deriveSupportStatus(ticket);

      return {
        ...ticket,
        priority: derivePriority(ticket),
        supportStatus,
        organization: orgName,
        assignee: deriveAssignee(ticket),
        ageHours,
        slaState: getSlaState(ageHours, supportStatus)
      };
    });
  }, [orgName, tickets]);

  const filteredTickets = useMemo(() => {
    let next = normalizedTickets;

    if (view === "queue") next = next.filter((ticket) => ticket.supportStatus !== "resolved");
    if (view === "escalations") next = next.filter((ticket) => ticket.priority === "critical" || ticket.slaState === "breached");
    if (view === "resolved") next = next.filter((ticket) => ticket.supportStatus === "resolved");
    if (statusFilter !== "all") next = next.filter((ticket) => ticket.supportStatus === statusFilter);
    if (priorityFilter !== "all") next = next.filter((ticket) => ticket.priority === priorityFilter);
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      next = next.filter((ticket) =>
        [ticket.event, ticket.channel, ticket.customer_name ?? "", ticket.assignee, ticket.organization]
          .join(" ")
          .toLowerCase()
          .includes(term)
      );
    }

    return next;
  }, [normalizedTickets, priorityFilter, search, statusFilter, view]);

  const selectedTicket =
    filteredTickets.find((ticket) => ticket.id === selectedTicketId) ??
    filteredTickets[0] ??
    normalizedTickets[0] ??
    null;

  useEffect(() => {
    if (!selectedTicket && selectedTicketId) {
      setSelectedTicketId(null);
      return;
    }

    if (!selectedTicketId && filteredTickets[0]) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicket, selectedTicketId]);

  const metrics = useMemo(() => {
    const summaryCount = (status: string) =>
      summary.find((row) => row.status === status)?.count ??
      normalizedTickets.filter((ticket) => ticket.status === status).length;

    const openTickets = normalizedTickets.filter((ticket) => ticket.supportStatus !== "resolved").length;
    const urgentEscalations = normalizedTickets.filter(
      (ticket) => ticket.priority === "critical" || ticket.slaState === "breached"
    ).length;
    const resolvedToday = normalizedTickets.filter((ticket) => {
      if (ticket.supportStatus !== "resolved") return false;
      const sent = ticket.resolved_at ? new Date(ticket.resolved_at) : new Date(ticket.updated_at);
      return sent.toDateString() === new Date().toDateString();
    }).length;
    const slaBreaches = normalizedTickets.filter((ticket) => ticket.slaState === "breached").length;

    return [
      {
        label: "Open Tickets",
        value: summaryCount("open") + summaryCount("assigned") + summaryCount("in_progress") + summaryCount("escalated") || openTickets,
        hint: "Active queue items requiring an owner"
      },
      {
        label: "Urgent Escalations",
        value: urgentEscalations,
        hint: "Critical delivery failures or breached events"
      },
      {
        label: "Resolved Today",
        value: resolvedToday,
        hint: "Items moved to a sent or resolved state today"
      },
      {
        label: "SLA Breaches",
        value: slaBreaches,
        hint: "Queue items past the active response threshold"
      }
    ];
  }, [normalizedTickets, summary]);

  const recentActivity = useMemo(() => normalizedTickets.slice(0, 4), [normalizedTickets]);
  const queuePreview = useMemo(() => filteredTickets.slice(0, 6), [filteredTickets]);
  const openSelectedTicket = () => {
    if (!selectedTicket) return;
    navigate(`/app/kora-admin/support/${selectedTicket.id}`);
  };

  return (
    <div style={{ padding: 4 }}>
      <div style={{ display: "grid", gap: 20 }}>
        <section
          style={{
            borderRadius: 28,
            border: "1px solid color-mix(in srgb, var(--color-border) 70%, var(--color-accent) 30%)",
            background:
              "radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 14%, transparent) 0%, transparent 28%), linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 98%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
            padding: 24,
            boxShadow: "var(--shadow-shell)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap"
            }}
          >
            <div style={{ maxWidth: 720 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <span style={eyebrowStyle}>Support Domain</span>
                <span style={breadcrumbPillStyle}>Platform Control</span>
                <span style={breadcrumbPillStyle}>Support</span>
              </div>
              <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1, color: "var(--color-text-primary)" }}>Support</h1>
              <p
                style={{
                  margin: "12px 0 0",
                  maxWidth: 760,
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "var(--color-text-secondary)"
                }}
              >
                This workspace manages incoming issues, escalations, and customer resolutions across the live support
                queue. Parent-level overview keeps health, SLA risk, and activity visible before an operator drills into
                the working queue.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
              <button type="button" style={ghostButtonStyle} onClick={() => void refresh()}>
                Refresh Queue
              </button>
              <button
                type="button"
                style={ghostButtonStyle}
                onClick={openSelectedTicket}
                disabled={!selectedTicket}
              >
                Open Selected Ticket
              </button>
              <button
                type="button"
                style={primaryButtonStyle}
                onClick={() => navigate("/app/kora-admin/support?view=escalations")}
              >
                View Escalations
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 14,
              marginTop: 22
            }}
          >
            {metrics.map((metric) => (
              <div
                key={metric.label}
                style={{
                  borderRadius: 20,
                  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
                  background: "color-mix(in srgb, var(--color-surface) 78%, transparent)",
                  padding: 18
                }}
              >
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                  {metric.label}
                </div>
                <div style={{ marginTop: 10, fontSize: 30, fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {metric.value}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.55, color: "var(--color-text-muted)" }}>{metric.hint}</div>
              </div>
            ))}
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.55fr) minmax(320px, 0.95fr)",
            gap: 20
          }}
        >
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={sectionLabelStyle}>Queue Summary</div>
                <h2 style={panelTitleStyle}>Incoming ticket preview</h2>
              </div>
              <button
                type="button"
                style={miniButtonStyle}
                onClick={() => navigate("/app/kora-admin/support?view=queue")}
              >
                Open queue
              </button>
            </div>

            {state === "loading" ? (
              <div style={loadingStateStyle}>Loading live support queue…</div>
            ) : state === "error" ? (
              <div style={errorStateStyle}>{error ?? "Failed to load support queue."}</div>
            ) : queuePreview.length === 0 ? (
              <div style={emptyStateStyle}>
                <div style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)" }}>No tickets in queue</div>
                <div style={{ marginTop: 8, maxWidth: 420, color: "var(--color-text-muted)" }}>
                  The support surface is ready. When the next issue enters the queue, it will appear here with SLA,
                  assignee, and escalation signals.
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {queuePreview.map((ticket) => {
                  const priorityStyles = getPriorityStyles(ticket.priority);
                  const statusStyles = getStatusStyles(ticket.supportStatus);
                  const ticketLabel = ticket.customer_name ?? "Unknown customer";
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        navigate("/app/kora-admin/support?view=queue");
                      }}
                      style={{
                        borderRadius: 18,
                        border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
                        background: "color-mix(in srgb, var(--color-surface-2) 84%, transparent)",
                        padding: 16,
                        textAlign: "left",
                        cursor: "pointer",
                        display: "grid",
                        gap: 10
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>{ticket.event}</div>
                          <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
                            {ticket.organization} • {ticket.channel.toUpperCase()} • {ticket.assignee}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <span style={{ ...pillBaseStyle, color: priorityStyles.color, background: priorityStyles.background, borderColor: priorityStyles.border }}>
                            {ticket.priority}
                          </span>
                          <span style={{ ...pillBaseStyle, color: statusStyles.color, background: statusStyles.background, borderColor: statusStyles.border }}>
                            {ticket.supportStatus}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", color: "var(--color-text-secondary)", fontSize: 12 }}>
                        <span>{ticketLabel}</span>
                        <span>{ticket.ageHours}h in queue</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <div style={sectionLabelStyle}>Support Health</div>
                <h2 style={panelTitleStyle}>SLA and activity posture</h2>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={healthCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Response health</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-text-muted)" }}>
                      Live queue is currently {metrics[3].value > 0 ? "showing breached items that need intervention" : "within SLA thresholds"}.
                    </div>
                  </div>
                  <span style={metrics[3].value > 0 ? statusDotBadStyle : statusDotGoodStyle} />
                </div>
              </div>

              <div style={healthCardStyle}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Pending tasks</div>
                <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "grid", gap: 10 }}>
                  <li style={taskRowStyle}>Review escalations older than 6 hours</li>
                  <li style={taskRowStyle}>Confirm assignee coverage across high-priority channels</li>
                  <li style={taskRowStyle}>Verify delivery failures routed into the queue</li>
                </ul>
              </div>

              <div style={healthCardStyle}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>Recent activity</div>
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                  {recentActivity.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>No recent activity to show yet.</div>
                  ) : (
                    recentActivity.map((item) => (
                      <div key={`activity:${item.id}`} style={{ display: "grid", gap: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>{item.event}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                          {item.assignee} • {formatDate(item.created_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <section style={panelStyle}>
          <div style={{ ...panelHeaderStyle, marginBottom: 16 }}>
            <div>
              <div style={sectionLabelStyle}>Child Workspace</div>
              <h2 style={panelTitleStyle}>Support Queue</h2>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--color-text-muted)" }}>
                Functional queue workspace with filters, ticket inspection, and task-oriented layout.
              </div>
            </div>
            <button type="button" style={miniButtonStyle} onClick={() => void refresh()}>
              Refresh queue
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 16
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => navigate(`/app/kora-admin/support?view=${filter.value}`)}
                  style={{
                    ...tabButtonStyle,
                    borderColor:
                      view === filter.value
                        ? "color-mix(in srgb, var(--color-accent) 32%, transparent)"
                        : "color-mix(in srgb, var(--color-border) 76%, transparent)",
                    background:
                      view === filter.value
                        ? "var(--color-accent-dim)"
                        : "color-mix(in srgb, var(--color-surface-2) 84%, transparent)",
                    color: view === filter.value ? "var(--color-accent)" : "var(--color-text-secondary)"
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search event, customer, channel"
                style={inputStyle}
              />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} style={selectStyle}>
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="triage">Triage</option>
                <option value="resolved">Resolved</option>
              </select>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)} style={selectStyle}>
                <option value="all">All priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select style={selectStyle} defaultValue="demo">
                <option value="demo">Demo Organization</option>
              </select>
              <select style={selectStyle} defaultValue="today">
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
              </select>
            </div>
          </div>

          {state === "loading" ? (
            <div style={loadingStateStyle}>Loading support queue…</div>
          ) : state === "error" ? (
            <div style={errorStateStyle}>{error ?? "Failed to load support queue."}</div>
          ) : filteredTickets.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)" }}>Nothing matches these filters</div>
              <div style={{ marginTop: 8, maxWidth: 440, color: "var(--color-text-muted)" }}>
                Adjust the queue filters or refresh the workspace to pull in the latest support events.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.55fr) minmax(320px, 0.9fr)",
                gap: 18
              }}
            >
              <div
                style={{
                  borderRadius: 20,
                  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
                  overflow: "hidden",
                  background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)"
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 0.9fr 0.7fr 0.8fr 0.6fr 0.7fr",
                    gap: 0,
                    borderBottom: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
                    background: "color-mix(in srgb, var(--color-surface) 82%, transparent)"
                  }}
                >
                  {["Ticket", "Organization", "Priority", "Status", "Assignee", "Age"].map((label) => (
                    <div
                      key={label}
                      style={{
                        padding: "12px 14px",
                        fontSize: 11,
                        color: "var(--color-text-muted)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontFamily: "'DM Mono', monospace"
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {filteredTickets.map((ticket) => {
                  const priorityStyles = getPriorityStyles(ticket.priority);
                  const statusStyles = getStatusStyles(ticket.supportStatus);
                  const active = selectedTicket?.id === ticket.id;
                  const ticketLabel = ticket.customer_name ?? "Unknown customer";

                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedTicketId(ticket.id)}
                      style={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "1.2fr 0.9fr 0.7fr 0.8fr 0.6fr 0.7fr",
                        border: "none",
                        borderBottom: "1px solid color-mix(in srgb, var(--color-border) 68%, transparent)",
                        background: active ? "var(--color-accent-soft)" : "transparent",
                        color: "inherit",
                        textAlign: "left",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ padding: "14px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{ticket.event}</div>
                        <div style={{ marginTop: 5, fontSize: 12, color: "var(--color-text-muted)" }}>{ticketLabel}</div>
                      </div>
                      <div style={tableCellStyle}>{ticket.organization}</div>
                      <div style={tableCellStyle}>
                        <span style={{ ...pillBaseStyle, color: priorityStyles.color, background: priorityStyles.background, borderColor: priorityStyles.border }}>
                          {ticket.priority}
                        </span>
                      </div>
                      <div style={tableCellStyle}>
                        <span style={{ ...pillBaseStyle, color: statusStyles.color, background: statusStyles.background, borderColor: statusStyles.border }}>
                          {ticket.supportStatus}
                        </span>
                      </div>
                      <div style={tableCellStyle}>{ticket.assignee}</div>
                      <div style={tableCellStyle}>{ticket.ageHours}h</div>
                    </button>
                  );
                })}
              </div>

              <aside
                style={{
                  borderRadius: 22,
                  border: "1px solid color-mix(in srgb, var(--color-border) 72%, var(--color-accent) 28%)",
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 94%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
                  padding: 18,
                  boxShadow: "var(--shadow-shell)"
                }}
              >
                {selectedTicket ? (
                  <div style={{ display: "grid", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={sectionLabelStyle}>Ticket inspection</div>
                        <div style={{ marginTop: 8, fontSize: 19, fontWeight: 700, color: "var(--color-text-primary)" }}>
                          {selectedTicket.event}
                        </div>
                      </div>
                      <button type="button" style={miniButtonStyle} onClick={openSelectedTicket}>
                        Open Ticket
                      </button>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ ...pillBaseStyle, ...getPriorityStyles(selectedTicket.priority) }}>{selectedTicket.priority}</span>
                      <span style={{ ...pillBaseStyle, ...getStatusStyles(selectedTicket.supportStatus) }}>{selectedTicket.supportStatus}</span>
                      <span style={{ ...pillBaseStyle, color: "var(--color-text-secondary)", background: "rgba(126, 143, 181, 0.1)", borderColor: "rgba(126, 143, 181, 0.2)" }}>
                        {selectedTicket.channel}
                      </span>
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      <DetailRow label="Organization" value={selectedTicket.organization} />
                      <DetailRow label="Customer" value={selectedTicket.customer_name ?? "Unknown customer"} />
                      <DetailRow label="Assignee" value={selectedTicket.assignee} />
                      <DetailRow label="Created" value={formatDate(selectedTicket.created_at)} />
                      <DetailRow label="Last updated" value={formatDate(selectedTicket.updated_at)} />
                      <DetailRow label="SLA state" value={selectedTicket.slaState} />
                    </div>

                    <div style={detailBlockStyle}>
                      <div style={detailBlockTitleStyle}>Operational notes</div>
                      <div style={detailBlockValueStyle}>
                        {selectedTicket.resolution_note || selectedTicket.description || "No additional notes recorded for this support ticket yet."}
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 10 }}>
                      <button type="button" style={primaryButtonStyle} onClick={openSelectedTicket}>
                        Open Ticket
                      </button>
                      <button type="button" style={ghostButtonStyle} onClick={() => void refresh()}>
                        Refresh Queue
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={emptyStateStyle}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)" }}>No ticket selected</div>
                    <div style={{ marginTop: 8, color: "var(--color-text-muted)" }}>
                      Choose a queue item to inspect the drawer details.
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const panelStyle = {
  borderRadius: 24,
  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
  background:
    "linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 96%, transparent), color-mix(in srgb, var(--color-surface-2) 96%, transparent))",
  padding: 20,
  boxShadow: "var(--shadow-shell)"
} as const;

const panelHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap"
} as const;

const panelTitleStyle = {
  margin: "6px 0 0",
  fontSize: 22,
  color: "var(--color-text-primary)"
} as const;

const sectionLabelStyle = {
  fontSize: 11,
  color: "var(--color-accent)",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace"
} as const;

const eyebrowStyle = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "var(--color-accent-dim)",
  border: "1px solid color-mix(in srgb, var(--color-accent) 28%, transparent)",
  color: "var(--color-accent)",
  fontSize: 11,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace"
} as const;

const breadcrumbPillStyle = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  color: "var(--color-text-muted)",
  fontSize: 11,
  fontFamily: "'DM Mono', monospace"
} as const;

const pillBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 9px",
  borderRadius: 999,
  border: "1px solid transparent",
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace"
} as const;

const primaryButtonStyle = {
  padding: "11px 14px",
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--color-accent) 36%, transparent)",
  background:
    "linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 18%, var(--color-surface) 82%), color-mix(in srgb, var(--color-surface-2) 92%, transparent))",
  color: "var(--color-text-primary)",
  fontWeight: 600,
  cursor: "pointer"
} as const;

const ghostButtonStyle = {
  padding: "11px 14px",
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  background: "color-mix(in srgb, var(--color-surface) 82%, transparent)",
  color: "var(--color-text-secondary)",
  fontWeight: 600,
  cursor: "pointer"
} as const;

const miniButtonStyle = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 84%, transparent)",
  color: "var(--color-text-secondary)",
  cursor: "pointer"
} as const;

const loadingStateStyle = {
  minHeight: 220,
  borderRadius: 18,
  border: "1px dashed color-mix(in srgb, var(--color-border) 72%, transparent)",
  display: "grid",
  placeItems: "center",
  color: "var(--color-text-muted)"
} as const;

const errorStateStyle = {
  minHeight: 220,
  borderRadius: 18,
  border: "1px solid rgba(239, 68, 68, 0.24)",
  background: "rgba(239, 68, 68, 0.08)",
  display: "grid",
  placeItems: "center",
  color: "#ffd6db",
  padding: 20
} as const;

const emptyStateStyle = {
  minHeight: 220,
  borderRadius: 18,
  border: "1px dashed color-mix(in srgb, var(--color-border) 72%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 72%, transparent)",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  padding: 22
} as const;

const healthCardStyle = {
  borderRadius: 18,
  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 82%, transparent)",
  padding: 16
} as const;

const statusDotGoodStyle = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "var(--color-success)",
  boxShadow: "0 0 14px color-mix(in srgb, var(--color-success) 64%, transparent)"
} as const;

const statusDotBadStyle = {
  width: 10,
  height: 10,
  borderRadius: 999,
  background: "var(--color-danger)",
  boxShadow: "0 0 14px color-mix(in srgb, var(--color-danger) 64%, transparent)"
} as const;

const taskRowStyle = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
  background: "color-mix(in srgb, var(--color-surface) 72%, transparent)",
  fontSize: 12,
  color: "var(--color-text-secondary)"
} as const;

const tabButtonStyle = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid transparent",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600
} as const;

const inputStyle = {
  minWidth: 230,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 84%, transparent)",
  color: "var(--color-text-primary)"
} as const;

const selectStyle = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid color-mix(in srgb, var(--color-border) 74%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 84%, transparent)",
  color: "var(--color-text-secondary)"
} as const;

const tableCellStyle = {
  padding: "14px 14px",
  fontSize: 12,
  color: "var(--color-text-secondary)",
  display: "flex",
  alignItems: "center"
} as const;

const detailBlockStyle = {
  borderRadius: 16,
  border: "1px solid color-mix(in srgb, var(--color-border) 72%, transparent)",
  background: "color-mix(in srgb, var(--color-surface-2) 78%, transparent)",
  padding: 14
} as const;

const detailBlockTitleStyle = {
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontFamily: "'DM Mono', monospace",
  color: "var(--color-text-muted)"
} as const;

const detailBlockValueStyle = {
  marginTop: 10,
  fontSize: 13,
  lineHeight: 1.7,
  color: "var(--color-text-secondary)"
} as const;
