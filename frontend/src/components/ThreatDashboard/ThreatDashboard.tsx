import React, { useEffect, useState } from "react";
import { useSecurityDashboard } from "../../hooks/useSecurityDashboard";
import { MetricsCard } from "./MetricsCard";
import { ThreatList } from "./ThreatList";
import { ThreatTimeline } from "./ThreatTimeline";
import { IncidentPanel } from "./IncidentPanel";
import { DetectorStatus } from "./DetectorStatus";
import { AlertCircle, BarChart3, Shield, TrendingUp } from "lucide-react";

export interface ThreatDashboardProps {
  organizationId: string;
  refreshInterval?: number; // milliseconds
}

export const ThreatDashboard: React.FC<ThreatDashboardProps> = ({
  organizationId,
  refreshInterval = 30000,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "threats" | "incidents" | "detectors"
  >("overview");
  const {
    metrics,
    threats,
    incidents,
    detectors,
    loading,
    error,
    refresh,
  } = useSecurityDashboard(organizationId);

  useEffect(() => {
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, refresh]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="text-red-600 w-6 h-6" />
            <h3 className="text-lg font-semibold text-red-800">
              Dashboard Error
            </h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10" />
              <h1 className="text-3xl font-bold">Security Threat Dashboard</h1>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="bg-white hover:bg-gray-100 disabled:bg-gray-200 text-blue-900 px-4 py-2 rounded-md font-medium transition"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Active Threats"
            value={metrics?.activeThreats || 0}
            icon={AlertCircle}
            trend={metrics?.threatsTrend}
            color="red"
          />
          <MetricsCard
            title="Failed Logins (24h)"
            value={metrics?.failedLogins24h || 0}
            icon={TrendingUp}
            trend={metrics?.failedLoginsTrend}
            color="orange"
          />
          <MetricsCard
            title="Cross-Org Attempts"
            value={metrics?.crossOrgAttempts24h || 0}
            icon={Shield}
            trend={metrics?.crossOrgTrend}
            color="purple"
          />
          <MetricsCard
            title="Sessions Revoked (24h)"
            value={metrics?.sessionsRevoked24h || 0}
            icon={BarChart3}
            trend={metrics?.sessionsRevokedTrend}
            color="yellow"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="flex border-b">
            {[
              { id: "overview", label: "Overview" },
              { id: "threats", label: "Active Threats" },
              { id: "incidents", label: "Incidents" },
              { id: "detectors", label: "Detectors" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(
                    tab.id as
                      | "overview"
                      | "threats"
                      | "incidents"
                      | "detectors"
                  )
                }
                className={`flex-1 px-6 py-4 font-medium transition ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <ThreatTimeline threats={threats.slice(0, 10)} />
              </div>
            )}

            {activeTab === "threats" && (
              <ThreatList threats={threats} loading={loading} />
            )}

            {activeTab === "incidents" && (
              <IncidentPanel incidents={incidents} loading={loading} />
            )}

            {activeTab === "detectors" && (
              <DetectorStatus detectors={detectors} loading={loading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatDashboard;
