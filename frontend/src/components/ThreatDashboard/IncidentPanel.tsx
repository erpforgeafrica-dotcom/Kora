import React, { useState } from "react";
import { AlertTriangle, Clock, User, ChevronRight } from "lucide-react";

interface Incident {
  id: string;
  incident_type: string;
  status: "open" | "investigating" | "resolved" | "closed";
  threat_signal_ids: string[];
  affected_users: string[];
  created_at: string;
  investigation_notes?: string;
}

interface IncidentPanelProps {
  incidents: Incident[];
  loading?: boolean;
  onIncidentUpdate?: (incidentId: string, updates: any) => Promise<void>;
}

const statusColors = {
  open: "bg-red-100 text-red-800 border-red-300",
  investigating: "bg-yellow-100 text-yellow-800 border-yellow-300",
  resolved: "bg-green-100 text-green-800 border-green-300",
  closed: "bg-gray-100 text-gray-800 border-gray-300",
};

export const IncidentPanel: React.FC<IncidentPanelProps> = ({
  incidents,
  loading = false,
  onIncidentUpdate,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = async (
    incidentId: string,
    newStatus: string
  ) => {
    setUpdating(incidentId);
    try {
      await onIncidentUpdate?.(incidentId, { status: newStatus });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No incidents</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident) => (
        <div
          key={incident.id}
          className="border rounded-lg bg-white hover:shadow-md transition"
        >
          {/* Main Row */}
          <div
            className="p-4 flex items-center justify-between cursor-pointer"
            onClick={() =>
              setExpandedId(expandedId === incident.id ? null : incident.id)
            }
          >
            <div className="flex items-center gap-4 flex-1">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div className="flex-1">
                <h4 className="font-semibold">
                  {incident.incident_type.replace(/_/g, " ")}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {incident.threat_signal_ids.length} threat signal
                  {incident.threat_signal_ids.length !== 1 ? "s" : ""} •{" "}
                  {incident.affected_users.length} user
                  {incident.affected_users.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${statusColors[incident.status]}`}
              >
                {incident.status}
              </span>
              <ChevronRight
                className={`w-5 h-5 transition ${
                  expandedId === incident.id ? "rotate-90" : ""
                }`}
              />
            </div>
          </div>

          {/* Expanded Details */}
          {expandedId === incident.id && (
            <div className="border-t p-4 bg-gray-50 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs opacity-60 uppercase tracking-wide">
                    Created
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4 opacity-60" />
                    <p className="text-sm">
                      {new Date(incident.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs opacity-60 uppercase tracking-wide">
                    Affected Users
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <User className="w-4 h-4 opacity-60" />
                    <p className="text-sm">
                      {incident.affected_users.length} user
                      {incident.affected_users.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {incident.investigation_notes && (
                <div>
                  <p className="text-xs opacity-60 uppercase tracking-wide mb-2">
                    Investigation Notes
                  </p>
                  <p className="text-sm bg-white p-3 rounded border">
                    {incident.investigation_notes}
                  </p>
                </div>
              )}

              {incident.status !== "closed" && (
                <div>
                  <p className="text-xs opacity-60 uppercase tracking-wide mb-2">
                    Update Status
                  </p>
                  <div className="flex gap-2">
                    {["investigating", "resolved", "closed"].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(incident.id, status)}
                        disabled={updating === incident.id}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-3 rounded-md text-xs font-medium transition capitalize"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
