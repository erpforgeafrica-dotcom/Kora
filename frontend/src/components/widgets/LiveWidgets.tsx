import { useLiveData } from "../../hooks/useLiveData";
import { LiveWidget } from "./LiveWidget";

const BookingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const RevenueIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const StaffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

interface BookingData {
  today_total: number;
  completed: number;
  pending: number;
  vs_yesterday_pct: number;
}

interface RevenueData {
  today: number;
  this_week: number;
  vs_last_week_pct: number;
}

interface StaffData {
  active_count: number;
  utilisation_rate_pct: number;
  understaffed_slots: number;
}

interface AlertData {
  critical_count: number;
  high_count: number;
  total_count: number;
}

export function LiveBookingsWidget() {
  const { data, loading } = useLiveData<BookingData>({
    fetcher: async () => {
      const res = await fetch("/api/bookings/today");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return res.json();
    },
    refreshInterval: 15000,
  });

  return (
    <LiveWidget
      title="Bookings Today"
      value={data?.today_total ?? 0}
      subtitle={`${data?.completed ?? 0} completed · ${data?.pending ?? 0} pending`}
      trend={data?.vs_yesterday_pct ? { value: data.vs_yesterday_pct, label: "vs yesterday" } : undefined}
      icon={<BookingIcon />}
      color="var(--color-accent)"
      loading={loading}
    />
  );
}

export function LiveRevenueWidget() {
  const { data, loading } = useLiveData<RevenueData>({
    fetcher: async () => {
      const res = await fetch("/api/analytics/business-summary");
      if (!res.ok) throw new Error("Failed to fetch revenue");
      const json = await res.json();
      return json.revenue;
    },
    refreshInterval: 30000,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(amount / 100);
  };

  return (
    <LiveWidget
      title="Revenue Today"
      value={formatCurrency(data?.today ?? 0)}
      subtitle={`${formatCurrency(data?.this_week ?? 0)} this week`}
      trend={data?.vs_last_week_pct ? { value: data.vs_last_week_pct, label: "vs last week" } : undefined}
      icon={<RevenueIcon />}
      color="#f59e0b"
      loading={loading}
    />
  );
}

export function LiveStaffWidget() {
  const { data, loading } = useLiveData<StaffData>({
    fetcher: async () => {
      const res = await fetch("/api/analytics/business-summary");
      if (!res.ok) throw new Error("Failed to fetch staff data");
      const json = await res.json();
      return json.staff ?? json.staff_profiles;
    },
    refreshInterval: 60000,
  });

  return (
    <LiveWidget
      title="Active Staff"
      value={data?.active_count ?? 0}
      subtitle={`${data?.utilisation_rate_pct?.toFixed(1) ?? 0}% utilization`}
      icon={<StaffIcon />}
      color="#a78bfa"
      loading={loading}
    />
  );
}

export function LiveAlertsWidget() {
  const { data, loading } = useLiveData<AlertData>({
    fetcher: async () => {
      const res = await fetch("/api/analytics/business-summary");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const json = await res.json();
      const alerts = json.ai_alerts ?? [];
      return {
        critical_count: alerts.filter((a: { severity: string }) => a.severity === "critical").length,
        high_count: alerts.filter((a: { severity: string }) => a.severity === "high").length,
        total_count: alerts.length,
      };
    },
    refreshInterval: 20000,
  });

  return (
    <LiveWidget
      title="Emergency Alerts"
      value={data?.critical_count ?? 0}
      subtitle={`${data?.high_count ?? 0} high priority · ${data?.total_count ?? 0} total`}
      icon={<AlertIcon />}
      color={data && data.critical_count > 0 ? "var(--color-danger)" : "var(--color-success)"}
      loading={loading}
    />
  );
}
