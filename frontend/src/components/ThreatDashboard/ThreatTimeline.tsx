import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Threat {
  id: string;
  signal_type: string;
  detected_at: string;
  threat_score: number;
}

interface ThreatTimelineProps {
  threats: Threat[];
}

export const ThreatTimeline: React.FC<ThreatTimelineProps> = ({ threats }) => {
  // Group threats by hour
  const threatsByHour = threats.reduce(
    (acc, threat) => {
      const hour = new Date(threat.detected_at).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const existing = acc.find((item) => item.hour === hour);
      if (existing) {
        existing.count += 1;
        existing.avgScore =
          (existing.avgScore * (existing.count - 1) + threat.threat_score) /
          existing.count;
      } else {
        acc.push({ hour, count: 1, avgScore: threat.threat_score });
      }
      return acc;
    },
    [] as Array<{ hour: string; count: number; avgScore: number }>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-6">Threat Timeline (Last 24h)</h3>

      {threatsByHour.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No threat data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={threatsByHour}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip
              formatter={(value) => (typeof value === "number" ? value.toFixed(1) : value)}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Bar
              dataKey="count"
              fill="#ef4444"
              name="Threat Count"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
