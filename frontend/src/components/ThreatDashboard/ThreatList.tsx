import React, { useState } from "react";
import { AlertCircle, ChevronRight, Clock, MapPin } from "lucide-react";

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

interface ThreatListProps {
  threats: Threat[];
  loading?: boolean;
  onThreatClick?: (threatId: string) => void;
}

const severityColors = {
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
  LOW: "bg-blue-100 text-blue-800 border-blue-300",
};

const severityBgColors = {
  CRITICAL: "bg-red-50 hover:bg-red-100",
  HIGH: "bg-orange-50 hover:bg-orange-100",
  MEDIUM: "bg-yellow-50 hover:bg-yellow-100",
  LOW: "bg-blue-50 hover:bg-blue-100",
};

export const ThreatList: React.FC<ThreatListProps> = ({
  threats,
  loading = false,
  onThreatClick,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (threats.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No threats detected</p>
        <p className="text-gray-400 text-sm mt-1">
          Your organization is secure
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threats.map((threat) => (
        <div
          key={threat.id}
          className={`border rounded-lg transition cursor-pointer ${severityBgColors[threat.severity]}`}
          onClick={() => {
            setExpandedId(
              expandedId === threat.id ? null : threat.id
            );
            onThreatClick?.(threat.id);
          }}
        >
          {/* Main Threat Row */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <AlertCircle className={`w-6 h-6`} />
              <div className="flex-1">
                <h4 className="font-semibold capitalize">
                  {threat.signal_type.replace(/_/g, " ").toLowerCase()}
                </h4>
                <p className="text-sm opacity-75 mt-1">
                  Threat Score: {threat.threat_score}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border ${severityColors[threat.severity]}`}
              >
                {threat.severity}
              </span>
              <ChevronRight
                className={`w-5 h-5 transition ${
                  expandedId === threat.id ? "rotate-90" : ""
                }`}
              />
            </div>
          </div>

          {/* Expanded Details */}
          {expandedId === threat.id && (
            <div className="border-t px-4 py-4 space-y-3 bg-opacity-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs opacity-50 uppercase tracking-wide">
                    Detected
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 opacity-60" />
                    <p className="text-sm">
                      {new Date(threat.detected_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {threat.source_ip && (
                  <div>
                    <p className="text-xs opacity-50 uppercase tracking-wide">
                      Source IP
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 opacity-60" />
                      <p className="text-sm font-mono">{threat.source_ip}</p>
                    </div>
                  </div>
                )}

                {threat.user_id && (
                  <div>
                    <p className="text-xs opacity-50 uppercase tracking-wide">
                      User ID
                    </p>
                    <p className="text-sm font-mono mt-1">{threat.user_id}</p>
                  </div>
                )}

                {threat.status && (
                  <div>
                    <p className="text-xs opacity-50 uppercase tracking-wide">
                      Status
                    </p>
                    <p className="text-sm capitalize mt-1">{threat.status}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm font-medium transition">
                  Investigate
                </button>
                <button className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-3 rounded-md text-sm font-medium transition">
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
