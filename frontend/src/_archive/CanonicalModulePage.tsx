import { useEffect, useState, type DependencyList, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import type { DashboardRole } from "../../auth/dashboardAccess";
import { findMasterNavItem, getMasterNav } from "../../data/masterDashboardNavigation";
import {
  APIError,
  getAIInsights,
  getAISpendSummary,
  getAnomalies,
  getCanvaTemplates,
  getClientProfile,
  getCampaigns,
  getCustomerRanks,
  getDiscoveryCategories,
  getFeatureFlags,
  getPaymentTransactions,
  getPlatformUsers,
  getRevenueAnalytics,
  getSupportQueue,
  getTenantBranches,
  searchVenues
} from "../../services/api";
import { SocialCalendar } from "../../components/social/Calendar";
import { AIInsightsDashboard } from "../audience/AIInsightsDashboard";
import { EmergencyModule } from "../audience/EmergencyModule";
import AnomalyFeed from "../../components/AnomalyFeed";
import { NotFoundPage } from "../NotFoundPage";

export function CanonicalModulePage({ role }: { role: DashboardRole }) {
  const { pageKey = "" } = useParams();
  const item = findMasterNavItem(role, pageKey);
  const nav = getMasterNav(role);

  if (!item) {
    return <NotFoundPage />;
  }

  if (role === "client" && pageKey === "search") {
    return <ClientSearchPage />;
  }

  if (role === "business_admin" && pageKey === "locations") {
    return <LocationsPage />;
  }

  if (role === "business_admin" && pageKey === "ai-insights") {
    return <AIInsightsDashboard />;
  }

  if (role === "business_admin" && pageKey === "emergency") {
    return <EmergencyModule />;
  }

  if (role === "business_admin" && pageKey === "marketing") {
    return <MarketingPage />;
  }

  if (role === "business_admin" && pageKey === "crm") {
    return <CustomerRanksPage />;
  }

  if (role === "business_admin" && pageKey === "social") {
    return <SocialIntegrationsPage />;
  }

  if (role === "business_admin" && pageKey === "integrations") {
    return <CoreIntegrationsPage />;
  }

  if (role === "client" && pageKey === "bookings") {
    return <ClientBookingsPage />;
  }

  if (role === "client" && pageKey === "history") {
    return <ClientHistoryPage />;
  }

  if (role === "client" && pageKey === "telehealth") {
    return <ClientTelehealthPage />;
  }

  if (role === "operations" && pageKey === "support") {
    return <SupportTicketsPage />;
  }

  if (role === "operations" && pageKey === "alerts") {
    return <OperationsAlertsPage />;
  }

  if (role === "platform_admin" && pageKey === "features") {
    return <FeatureFlagsPage />;
  }

  if (role === "platform_admin" && pageKey === "users") {
    return <PlatformUsersPage />;
  }

  if (role === "platform_admin" && pageKey === "revenue") {
    return <PlatformRevenuePage />;
  }

  if (role === "platform_admin" && pageKey === "ai-usage") {
    return <PlatformAIUsagePage />;
  }

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 20,
          padding: 28,
          marginBottom: 18
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            color: "var(--color-accent)",
            fontFamily: "'DM Mono', monospace",
            marginBottom: 10
          }}
        >
          {nav.label.toUpperCase()}
        </div>
        <h1 style={{ margin: 0, fontSize: 28, color: "var(--color-text-primary)" }}>{item.label}</h1>
        <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--color-text-muted)", maxWidth: 720, lineHeight: 1.7 }}>
          Canonical flat route workspace aligned to the master brief. This page keeps the live app navigable while
          the underlying module is upgraded from generated or nested routing to dedicated route coverage.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.8fr)", gap: 20 }}>
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 18,
            padding: 22
          }}
        >
          <div style={eyebrowStyle}>API COVERAGE</div>
          {item.apis.length > 0 ? (
            item.apis.map((api) => (
              <div key={api} style={apiRowStyle}>
                <code style={{ color: "var(--color-text-secondary)", fontSize: 12 }}>{api}</code>
              </div>
            ))
          ) : (
            <div style={emptyStyle}>Static route. No live API required yet.</div>
          )}
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 18,
            padding: 22
          }}
        >
          <div style={eyebrowStyle}>ROUTE STATUS</div>
          <div style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            <div>Path: <code>{item.path}</code></div>
            <div>Role: <code>{role}</code></div>
            <div>Mode: canonical flat route</div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <Link to={nav.items[0].path} style={primaryLinkStyle}>Go To Dashboard</Link>
            <Link to="/app/planning" style={secondaryLinkStyle}>Open Planning</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientBookingsPage() {
  const clientId = localStorage.getItem("kora_client_id") ?? "client_demo";
  const state = useAsyncData(async () => {
    const profile = await getClientProfile(clientId);
    return [
      ...profile.upcoming_bookings.map((item) => ({
        title: item.service.name,
        meta: `${item.status} • ${formatDate(item.start_time)}`
      })),
      ...profile.booking_history.map((item) => ({
        title: item.service_name ?? "Completed service",
        meta: `${item.status} • ${formatDate(item.start_time)}`
      }))
    ];
  }, [clientId]);

  return (
    <LiveShell title="Bookings" description="Upcoming, completed, and cancelled bookings for the current client.">
      <RenderState state={state} empty="No bookings yet - use Search Services to get started.">
        {(items) => <TileGrid items={items} />}
      </RenderState>
    </LiveShell>
  );
}

function ClientHistoryPage() {
  const clientId = localStorage.getItem("kora_client_id") ?? "client_demo";
  const state = useAsyncData(async () => {
    const profile = await getClientProfile(clientId);
    return profile.booking_history.map((item) => ({
      title: item.service_name ?? "Service visit",
      meta: `${item.staff_name ?? "Unknown staff"} • ${formatDate(item.start_time)}`
    }));
  }, [clientId]);

  return (
    <LiveShell title="Service History" description="Completed service visits and historical activity.">
      <RenderState state={state} empty="No completed bookings yet.">
        {(items) => <TileGrid items={items} />}
      </RenderState>
    </LiveShell>
  );
}

function ClientTelehealthPage() {
  const clientId = localStorage.getItem("kora_client_id") ?? "client_demo";
  const state = useAsyncData(async () => {
    const profile = await getClientProfile(clientId);
    return profile.upcoming_bookings
      .filter((item) => profile.telehealth_consent)
      .map((item) => ({
        title: item.service.name,
        meta: `${item.status} • ${formatDate(item.start_time)}`
      }));
  }, [clientId]);

  return (
    <LiveShell title="Telehealth" description="Upcoming virtual sessions for the active client.">
      <RenderState state={state} empty="No telehealth sessions - book a virtual consultation.">
        {(items) => <TileGrid items={items} />}
      </RenderState>
    </LiveShell>
  );
}

function ClientSearchPage() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await getDiscoveryCategories();
        if (!active) return;
        setCategories(response.categories);
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      void searchVenues({ q: query.trim() })
        .then((response) => setResults(response.venues))
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setSearching(false));
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  return (
      <LiveShell title="Search Services" description="Search for a service or browse by category above.">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search services or providers"
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text-primary)",
          fontSize: 13
        }}
      />
      {loading ? <StateBox label="Loading categories..." /> : null}
      {error ? <StateBox label={error} tone="warning" /> : null}
      <TileGrid items={categories.map((item) => ({ title: item.label, meta: `${item.count ?? 0} venues` }))} />
      {searching ? <StateBox label="Searching venues..." /> : null}
      {!searching && query && results.length === 0 ? <StateBox label="No venues found for this search." /> : null}
      <TileGrid items={results.map((item) => ({ title: item.display_name, meta: `${item.city} • ${item.rating ?? 0}★` }))} />
    </LiveShell>
  );
}

function LocationsPage() {
  const state = useAsyncData(async () => {
    const response = await getTenantBranches();
    return response.branches;
  }, []);

  return (
    <LiveShell title="Locations" description="Branch and location coverage for the active business.">
      <RenderState state={state} empty="No branches configured yet.">
        {(branches) => <TileGrid items={branches.map((item) => ({ title: item.name, meta: [item.city, item.country].filter(Boolean).join(", ") || "Location pending" }))} />}
      </RenderState>
    </LiveShell>
  );
}

function MarketingPage() {
  const state = useAsyncData(async () => {
    const response = await getCampaigns();
    return response.campaigns;
  }, []);

  return (
    <LiveShell title="Marketing Tools" description="Campaigns and outbound engagement workflows.">
      <RenderState state={state} empty="No campaigns created yet.">
        {(campaigns) => (
          <div style={{ display: "grid", gap: 16 }}>
            <SocialCalendar campaigns={campaigns} />
            <TileGrid items={campaigns.map((item) => ({ title: item.name, meta: `${item.channel} • ${item.status}` }))} />
          </div>
        )}
      </RenderState>
    </LiveShell>
  );
}

function SocialIntegrationsPage() {
  return (
    <LiveShell title="Social Media Integrations" description="Business social integrations are configured here when OAuth is ready.">
      <TileGrid
        items={[
          { title: "Instagram", meta: "Not connected" },
          { title: "Facebook", meta: "Not connected" },
          { title: "Google Business", meta: "Not connected" },
          { title: "Canva", meta: "OAuth ready" }
        ]}
      />
    </LiveShell>
  );
}

function CoreIntegrationsPage() {
  const state = useAsyncData(async () => {
    const templates = await getCanvaTemplates().catch(() => ({ count: 0, templates: [] }));
    return [
      { title: "Stripe", meta: "Connected" },
      { title: "Twilio / SendGrid", meta: "Not connected" },
      { title: "Google Calendar", meta: "Not connected" },
      { title: "HubSpot", meta: "Not connected" },
      { title: "Google Analytics", meta: "Not connected" },
      { title: "Canva Templates", meta: `${templates.count} synced` }
    ];
  }, []);

  return (
    <LiveShell title="Integrations" description="Core third-party integrations for the business workspace.">
      <RenderState state={state} empty="No integrations configured yet.">
        {(items) => <TileGrid items={items} />}
      </RenderState>
    </LiveShell>
  );
}

function CustomerRanksPage() {
  const state = useAsyncData(async () => {
    const response = await getCustomerRanks();
    return response.ranks;
  }, []);

  return (
    <LiveShell title="Customer CRM" description="Customer ranks and lifecycle structure for the active business.">
      <RenderState state={state} empty="No customer ranks configured yet.">
        {(ranks) => <TileGrid items={ranks.map((item) => ({ title: item.name, meta: `${item.points_threshold ?? 0} pts threshold` }))} />}
      </RenderState>
    </LiveShell>
  );
}

function SupportTicketsPage() {
  const state = useAsyncData(async () => {
    const response = await getSupportQueue();
    return response.tickets;
  }, []);

  return (
    <LiveShell title="Support Tickets" description="Operations-facing support queue from the live notification and ticket stream.">
      <RenderState state={state} empty="No support tickets in the queue.">
        {(tickets) => <TileGrid items={tickets.map((item) => ({ title: item.event || "Support request", meta: item.status || "queued" }))} />}
      </RenderState>
    </LiveShell>
  );
}

function OperationsAlertsPage() {
  const [aiSummary, setAiSummary] = useState<string>("Loading AI insights...");

  useEffect(() => {
    void Promise.all([getAIInsights(), getAnomalies()])
      .then(([insights, anomalies]) => {
        const topInsight = insights.insights[0]?.title ?? "No AI insight";
        setAiSummary(`${topInsight} • ${anomalies.anomalies.length} anomaly signals`);
      })
      .catch((err) => setAiSummary(getErrorMessage(err)));
  }, []);

  return (
    <LiveShell title="System Alerts" description="Live anomaly feed and AI alert summary for operations.">
      <StateBox label={aiSummary} />
      <AnomalyFeed />
    </LiveShell>
  );
}

function FeatureFlagsPage() {
  const state = useAsyncData(async () => {
    const response = await getFeatureFlags();
    return response.flags;
  }, []);

  return (
    <LiveShell title="Feature Flags" description="Platform capability toggles returned by the live backend.">
      <RenderState state={state} empty="No feature flags returned by the backend.">
        {(flags) => <TileGrid items={flags.map((item) => ({ title: item.key, meta: `${item.enabled ? "enabled" : "disabled"} • ${item.scope} / ${item.source}` }))} />}
      </RenderState>
    </LiveShell>
  );
}

function PlatformUsersPage() {
  const state = useAsyncData(async () => {
    const response = await getPlatformUsers();
    return response.users;
  }, []);

  return (
    <LiveShell title="User Management" description="Recent platform users and their tenant affiliation.">
      <RenderState state={state} empty="No platform users returned by the backend.">
        {(users) => <TileGrid items={users.map((item) => ({ title: item.email, meta: `${item.role_id ?? "unassigned"} • ${item.name ?? "No name"}` }))} />}
      </RenderState>
    </LiveShell>
  );
}

function PlatformRevenuePage() {
  const state = useAsyncData(async () => {
    const summary = await getRevenueAnalytics();
    return summary.by_org.map((item) => ({
      title: item.org_name,
      meta: `${formatMoney(item.completed_revenue_cents / 100)} • ${item.transaction_count} txns`
    }));
  }, []);

  return (
    <LiveShell title="Revenue & Subscriptions" description="Platform-wide revenue analytics by tenant.">
      <RenderState state={state} empty="No revenue analytics available yet.">
        {(items) => <TileGrid items={items} />}
      </RenderState>
    </LiveShell>
  );
}

function PlatformAIUsagePage() {
  const state = useAsyncData(async () => {
    const summary = await getAISpendSummary();
    return Object.entries(summary.by_provider ?? {}).map(([provider, amount]) => ({
      title: provider,
      meta: `${formatMoney(Number(amount) || 0)} spent`
    }));
  }, []);

  return (
    <LiveShell title="AI Usage Metrics" description="Provider-level AI spend surfaced from the live platform admin API.">
      <RenderState state={state} empty="No AI usage metrics returned by the backend.">
        {(items) => <TileGrid items={items} />}
      </RenderState>
    </LiveShell>
  );
}

function LiveShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 20, padding: 28, marginBottom: 18 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--color-accent)", fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
          LIVE MODULE
        </div>
        <h1 style={{ margin: 0, fontSize: 28, color: "var(--color-text-primary)" }}>{title}</h1>
        <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--color-text-muted)", maxWidth: 720, lineHeight: 1.7 }}>{description}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function RenderState<T>({
  state,
  empty,
  children
}: {
  state: { loading: boolean; error: string | null; data: T[] };
  empty: string;
  children: (data: T[]) => ReactNode;
}) {
  if (state.loading) {
    return <StateBox label="Loading module..." />;
  }
  if (state.error) {
    return <StateBox label={state.error} tone="warning" />;
  }
  if (state.data.length === 0) {
    return <StateBox label={empty} />;
  }
  return <>{children(state.data)}</>;
}

function TileGrid({ items }: { items: Array<{ title: string; meta: string }> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 6 }}>{item.title}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", lineHeight: 1.6 }}>{item.meta}</div>
        </div>
      ))}
    </div>
  );
}

function StateBox({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "warning" }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 14,
        border: `1px solid ${tone === "warning" ? "var(--color-warning)" : "var(--color-border)"}`,
        background: tone === "warning" ? "color-mix(in srgb, var(--color-warning) 10%, transparent)" : "var(--color-surface)",
        color: tone === "warning" ? "var(--color-warning)" : "var(--color-text-muted)",
        fontSize: 13
      }}
    >
      {label}
    </div>
  );
}

function useAsyncData<T>(fetcher: () => Promise<T[]>, deps: DependencyList) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void fetcher()
      .then((value) => {
        if (!active) return;
        setData(value);
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

function getErrorMessage(error: unknown) {
  if (error instanceof APIError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unable to load module.";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

const eyebrowStyle = {
  fontSize: 11,
  letterSpacing: "0.12em",
  color: "var(--color-accent)",
  fontFamily: "'DM Mono', monospace",
  marginBottom: 14
} as const;

const apiRowStyle = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--color-border)",
  marginBottom: 8,
  background: "var(--color-surface-2)"
} as const;

const emptyStyle = {
  fontSize: 14,
  color: "var(--color-text-muted)",
  lineHeight: 1.6
} as const;

const primaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 10,
  textDecoration: "none",
  background: "var(--color-accent-dim)",
  border: "1px solid var(--color-accent)",
  color: "var(--color-accent)",
  fontSize: 12,
  fontFamily: "'DM Mono', monospace"
} as const;

const secondaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: 10,
  textDecoration: "none",
  background: "var(--color-surface-2)",
  border: "1px solid var(--color-border)",
  color: "var(--color-text-secondary)",
  fontSize: 12,
  fontFamily: "'DM Mono', monospace"
} as const;
