import React, { useEffect, useState } from "react";
import PageLayout from "../../components/ui/PageLayout";
import DataTable from "../../components/ui/DataTable";
import { Button } from "../../components/ui/button";
import { useAI, AIMetrics, AILog, AIUsage, AIStaffMetric, AIConfig, AIAnomalyEvent } from "../../hooks/useAI";

export default function AIDashboardPage() {
  const { getMetrics, getLogs, getUsage, getStaffMetrics, getConfig, getAnomalies, updateConfig, resolveAnomaly } = useAI();
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [logs, setLogs] = useState<AILog[]>([]);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [staffIntel, setStaffIntel] = useState<AIStaffMetric[]>([]);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [anomalies, setAnomalies] = useState<AIAnomalyEvent[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metricsRes, logsRes, usageRes, staffRes, configRes, anomaliesRes] = await Promise.all([
          getMetrics(),
          getLogs(),
          getUsage(),
          getStaffMetrics(),
          getConfig(),
          getAnomalies()
        ]);
        setMetrics(metricsRes);
        setLogs(logsRes.logs || []);
        setUsage(usageRes);
        setStaffIntel(staffRes || []);
        setConfig(configRes);
        setAnomalies([...(anomaliesRes.liveStatisticalAnomalies || []), ...(anomaliesRes.anomalies || [])]);
      } catch (err) {
        console.error("Failed to load AI data", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, [getMetrics, getLogs, getUsage, getStaffMetrics]);

  const handleResolveAnomaly = (row: unknown) => {
    resolveAnomaly("dummy_id_here");
    console.log("Resolved anomaly via hook", row);
  };

  const anomalyColumns = [
    { header: "Type/Name", accessorKey: "type" },
    { header: "Severity", accessorKey: "severity" },
    { header: "Description", accessorKey: "description" },
    { header: "Timestamp", accessorKey: "timestamp" }
  ];

  const logColumns = [
    { header: "Action", accessorKey: "action" },
    { header: "Input Summary", accessorKey: "input_summary" },
    { header: "Output", accessorKey: "output" },
    { header: "Score", accessorKey: "score" },
    { header: "Reason", accessorKey: "reason" },
    { header: "Timestamp", accessorKey: "timestamp" }
  ];

  // Remote anomalies handled directly by state.

  const staffColumns = [
    { header: "Staff Name", accessorKey: "name" },
    { header: "AI Score", accessorKey: "score" },
    { header: "Assignments", accessorKey: "assignments" },
    { header: "Workload", accessorKey: "workload" }
  ];

  return (
    <PageLayout title="AI Dashboard" subtitle="Insights & Control Center">
      {loadingInitial ? (
        <div className="text-white">Loading intelligence data...</div>
      ) : (
        <div className="space-y-8">
          
          {/* AI Overview */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">AI Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <p className="text-sm text-gray-400">Total AI Requests</p>
                <p className="text-2xl font-bold text-white">{metrics?.decisionCount || 0}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">{metrics?.successRatePct || 100}%</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <p className="text-sm text-gray-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-white">{metrics?.avgResponseTimeMs || 0}ms</p>
              </div>
            </div>
          </section>

          {/* Bookings Intelligence */}
          <section>
             <h2 className="text-xl font-semibold text-white mb-4">Booking Intelligence</h2>
             <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Suggested vs Actual</p>
                  <p className="text-lg text-white">45 / 42</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Conversion Rate</p>
                  <p className="text-lg text-white">93.3%</p>
                </div>
             </div>
          </section>

          {/* Staff Intelligence */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Staff Intelligence</h2>
            <DataTable columns={staffColumns} data={staffIntel} />
          </section>

          {/* Anomaly Monitoring */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Anomaly Monitoring</h2>
            <DataTable 
              columns={anomalyColumns} 
              data={anomalies} 
              customActions={[
                { label: "Resolve", onClick: handleResolveAnomaly, variant: "primary" }
              ]}
            />
          </section>

          {/* AI Logs */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">AI Decision Logs</h2>
            <DataTable columns={logColumns} data={logs} />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cost Control */}
            <section className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Cost Control</h2>
              <div className="mb-4">
                <p className="text-sm text-gray-400">Total Tokens Used</p>
                <p className="text-lg text-white">{usage?.totalTokens || 0} / {usage?.maxTokens || '∞'}</p>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-400">Estimated Cost</p>
                <p className="text-lg text-white">${metrics?.totalCost?.toFixed(4) || '0.0000'}</p>
              </div>
              <div className="flex gap-4 border-t border-slate-700 pt-4">
                <Button variant="outline">Set Usage Limits</Button>
                <Button variant="ghost" className="text-red-400">Disable Features</Button>
              </div>
            </section>

            {/* Configuration */}
            <section className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
              <div className="space-y-4">
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Enable Auto-Assignment</span>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5" 
                    checked={config?.enableAutoAssignment ?? true}
                    onChange={(e) => {
                      const updated = { ...config!, enableAutoAssignment: e.target.checked };
                      setConfig(updated);
                      updateConfig(updated);
                    }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Enable Anomalies</span>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5" 
                    checked={config?.enableAnomalies ?? true}
                    onChange={(e) => {
                      const updated = { ...config!, enableAnomalies: e.target.checked };
                      setConfig(updated);
                      updateConfig(updated);
                    }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Anomaly Sensitivity 
                     <span className="ml-2 text-xs text-primary-400">({config?.anomalySensitivity ?? 2.0}x)</span>
                  </span>
                  <input 
                    type="range" min="1.0" max="5.0" step="0.1" className="w-32" 
                    value={config?.anomalySensitivity ?? 2.0}
                    onChange={(e) => {
                      const updated = { ...config!, anomalySensitivity: parseFloat(e.target.value) };
                      setConfig(updated);
                      updateConfig(updated);
                    }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Similarity Cutoff
                     <span className="ml-2 text-xs text-primary-400">({config?.similarityCutoff ?? 0.70})</span>
                  </span>
                  <input 
                    type="range" min="0.01" max="1.0" step="0.01" className="w-32" 
                    value={config?.similarityCutoff ?? 0.70}
                    onChange={(e) => {
                      const updated = { ...config!, similarityCutoff: parseFloat(e.target.value) };
                      setConfig(updated);
                      updateConfig(updated);
                    }}
                  />
                </div>

              </div>
            </section>
          </div>

        </div>
      )}
    </PageLayout>
  );
}
