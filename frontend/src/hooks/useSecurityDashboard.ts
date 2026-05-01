import { useCallback, useEffect, useState } from "react";

interface Metrics {
  activeThreats: number;
  failedLogins24h: number;
  crossOrgAttempts24h: number;
  sessionsRevoked24h: number;
  threatsTrend?: number;
  failedLoginsTrend?: number;
  crossOrgTrend?: number;
  sessionsRevokedTrend?: number;
}

interface Threat {
  id: string;
  signal_type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  threat_score: number;
  detected_at: string;
  source_ip?: string;
  user_id?: string;
  status?: string;
}

interface Incident {
  id: string;
  incident_type: string;
  status: "open" | "investigating" | "resolved" | "closed";
  threat_signal_ids: string[];
  affected_users: string[];
  created_at: string;
  investigation_notes?: string;
}

interface Detector {
  id: string;
  detector_name: string;
  display_name: string;
  enabled: boolean;
  risk_threshold: number;
  auto_response_enabled: boolean;
  auto_response_action?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const useSecurityDashboard = (organizationId: string) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [detectors, setDetectors] = useState<Detector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/security/dashboard/metrics`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch metrics");
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  const fetchThreats = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/security/dashboard/threats/active?limit=100`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch threats");
      const data = await response.json();
      setThreats(data.threats || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/security/dashboard/incidents?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch incidents");
      const data = await response.json();
      setIncidents(data.incidents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  const fetchDetectors = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/security/dashboard/detectors`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch detectors");
      const data = await response.json();
      setDetectors(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchThreats(),
        fetchIncidents(),
        fetchDetectors(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics, fetchThreats, fetchIncidents, fetchDetectors]);

  const updateIncident = useCallback(
    async (incidentId: string, updates: any) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/security/dashboard/incident/${incidentId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            body: JSON.stringify(updates),
          }
        );
        if (!response.ok) throw new Error("Failed to update incident");
        await fetchIncidents();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [fetchIncidents]
  );

  const updateDetector = useCallback(
    async (detectorId: string, updates: any) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/security/dashboard/detector/${detectorId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            body: JSON.stringify(updates),
          }
        );
        if (!response.ok) throw new Error("Failed to update detector");
        await fetchDetectors();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [fetchDetectors]
  );

  const dismissThreat = useCallback(
    async (threatId: string) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/security/dashboard/threat/${threatId}/dismiss`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to dismiss threat");
        await fetchThreats();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [fetchThreats]
  );

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    metrics,
    threats,
    incidents,
    detectors,
    loading,
    error,
    refresh,
    updateIncident,
    updateDetector,
    dismissThreat,
  };
};
