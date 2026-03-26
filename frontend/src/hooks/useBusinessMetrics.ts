import { useEffect, useState } from 'react';

export interface BusinessMetrics {
  tenant_id?: string | null;
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
    vs_last_month_pct: number;
  };
  bookings: {
    today_total: number;
    no_show_rate_pct: number;
    cancellation_rate_pct: number;
    avg_booking_value: number;
  };
  staff: {
    utilisation_rate_pct: number;
    top_performer_id: string;
    understaffed_slots: number;
  };
  clients: {
    active_count: number;
    at_churn_risk: number;
    new_this_month: number;
    avg_lifetime_value: number;
  };
  customers?: {
    active_count: number;
    at_churn_risk: number;
    new_this_month: number;
    avg_lifetime_value: number;
  };
  staff_profiles?: {
    utilisation_rate_pct: number;
    top_performer_id: string;
    understaffed_slots: number;
  };
  ai_alerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export interface ChurnRiskClient {
  id: string;
  name: string;
  days_since_visit: number;
  predicted_churn_pct: number;
  recommended_action: string;
  photo_url?: string;
}

export interface StaffUtilisation {
  id: string;
  name: string;
  utilisation_pct: number;
  bookings_this_week: number;
  revenue_this_week: number;
  role: string;
}

export interface BusinessMetricsWithDetails extends BusinessMetrics {
  churn_risk_clients: ChurnRiskClient[];
  staff_utilisation: StaffUtilisation[];
  revenue_by_day: Array<{ date: string; revenue: number; bookings: number; avg_value: number }>;
}

const MOCK_METRICS: BusinessMetricsWithDetails = {
  revenue: {
    today: 1240,
    this_week: 8540,
    this_month: 34200,
    vs_last_month_pct: 12.5,
  },
  bookings: {
    today_total: 18,
    no_show_rate_pct: 8.2,
    cancellation_rate_pct: 5.3,
    avg_booking_value: 68.50,
  },
  staff: {
    utilisation_rate_pct: 82,
    top_performer_id: 'staff-001',
    understaffed_slots: 3,
  },
  clients: {
    active_count: 342,
    at_churn_risk: 8,
    new_this_month: 23,
    avg_lifetime_value: 920,
  },
  ai_alerts: [
    {
      id: 'alert-1',
      severity: 'warning',
      title: 'High no-show rate',
      description: '8.2% no-show rate this week. Consider SMS reminders.',
      timestamp: new Date().toISOString(),
    },
    {
      id: 'alert-2',
      severity: 'info',
      title: 'Revenue trending up',
      description: '+12.5% vs last month. Strong booking demand ahead.',
      timestamp: new Date().toISOString(),
    },
  ],
  churn_risk_clients: [
    {
      id: 'client-1',
      name: 'Sarah Chen',
      days_since_visit: 47,
      predicted_churn_pct: 65,
      recommended_action: 'Send personalized offer for hair service',
      photo_url: undefined,
    },
    {
      id: 'client-2',
      name: 'Emma Rodriguez',
      days_since_visit: 52,
      predicted_churn_pct: 72,
      recommended_action: 'Offer free consultation + 15% discount',
      photo_url: undefined,
    },
    {
      id: 'client-3',
      name: 'Lisa Park',
      days_since_visit: 38,
      predicted_churn_pct: 42,
      recommended_action: 'Remind about loyalty tier benefits',
      photo_url: undefined,
    },
  ],
  staff_utilisation: [
    {
      id: 'staff-001',
      name: 'Alex Morrison',
      utilisation_pct: 94,
      bookings_this_week: 24,
      revenue_this_week: 1680,
      role: 'therapist',
    },
    {
      id: 'staff-002',
      name: 'Jordan Blake',
      utilisation_pct: 78,
      bookings_this_week: 19,
      revenue_this_week: 1365,
      role: 'therapist',
    },
    {
      id: 'staff-003',
      name: 'Casey Thompson',
      utilisation_pct: 65,
      bookings_this_week: 15,
      revenue_this_week: 1050,
      role: 'receptionist',
    },
    {
      id: 'staff-004',
      name: 'Morgan Lee',
      utilisation_pct: 72,
      bookings_this_week: 17,
      revenue_this_week: 1190,
      role: 'therapist',
    },
  ],
  revenue_by_day: [
    { date: '2026-03-01', revenue: 1200, bookings: 16, avg_value: 75 },
    { date: '2026-03-02', revenue: 1450, bookings: 19, avg_value: 76.3 },
    { date: '2026-03-03', revenue: 980, bookings: 13, avg_value: 75.4 },
    { date: '2026-03-04', revenue: 1580, bookings: 21, avg_value: 75.2 },
    { date: '2026-03-05', revenue: 1340, bookings: 18, avg_value: 74.4 },
    { date: '2026-03-06', revenue: 1240, bookings: 18, avg_value: 68.9 },
    { date: '2026-03-07', revenue: 1210, bookings: 15, avg_value: 80.7 },
  ],
};

export function useBusinessMetrics() {
  const [metrics, setMetrics] = useState<BusinessMetricsWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from backend
        const response = await fetch('/api/analytics/business-summary');
        if (response.ok) {
          const data = await response.json();
          setMetrics({
            ...data,
            clients: data.clients ?? data.customers ?? MOCK_METRICS.clients,
            customers: data.customers ?? data.clients ?? MOCK_METRICS.clients,
            staff: data.staff ?? data.staff_profiles ?? MOCK_METRICS.staff,
            staff_profiles: data.staff_profiles ?? data.staff ?? MOCK_METRICS.staff
          });
        } else {
          // Fall back to mock data if API is not available
          setMetrics(MOCK_METRICS);
        }
      } catch (err) {
        // Use mock data on network error
        setMetrics(MOCK_METRICS);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Poll every 60 seconds
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading, error };
}
