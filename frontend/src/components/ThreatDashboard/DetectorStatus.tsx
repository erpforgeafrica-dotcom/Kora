import React, { useState } from "react";
import { Settings, Eye, EyeOff } from "lucide-react";

interface Detector {
  id: string;
  detector_name: string;
  display_name: string;
  enabled: boolean;
  risk_threshold: number;
  auto_response_enabled: boolean;
  auto_response_action?: string;
}

interface DetectorStatusProps {
  detectors: Detector[];
  loading?: boolean;
  onDetectorUpdate?: (detectorId: string, updates: any) => Promise<void>;
}

export const DetectorStatus: React.FC<DetectorStatusProps> = ({
  detectors,
  loading = false,
  onDetectorUpdate,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggle = async (detector: Detector) => {
    setUpdatingId(detector.id);
    try {
      await onDetectorUpdate?.(detector.id, { enabled: !detector.enabled });
    } finally {
      setUpdatingId(null);
    }
  };

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {detectors.map((detector) => (
          <div
            key={detector.id}
            className={`border rounded-lg p-4 transition ${
              detector.enabled
                ? "bg-green-50 border-green-300"
                : "bg-gray-50 border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold">{detector.display_name}</h4>
                <p className="text-xs text-gray-600 mt-1 font-mono">
                  {detector.detector_name}
                </p>
              </div>
              <button
                onClick={() => handleToggle(detector)}
                disabled={updatingId === detector.id}
                className="p-2 hover:bg-white rounded-md transition"
              >
                {detector.enabled ? (
                  <Eye className="w-5 h-5 text-green-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>

            <div className="space-y-2 mb-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Risk Threshold:</span>
                <span className="font-mono font-semibold">
                  {detector.risk_threshold}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Auto Response:</span>
                <span
                  className={`font-semibold ${
                    detector.auto_response_enabled
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {detector.auto_response_enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              {detector.auto_response_action && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Action:</span>
                  <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                    {detector.auto_response_action.replace(/_/g, " ")}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() =>
                setEditingId(editingId === detector.id ? null : detector.id)
              }
              className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-3 rounded-md text-sm font-medium transition"
            >
              <Settings className="w-4 h-4" />
              {editingId === detector.id ? "Cancel" : "Configure"}
            </button>

            {editingId === detector.id && (
              <div className="mt-3 p-3 bg-white border rounded space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1">
                    Risk Threshold (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={detector.risk_threshold}
                    className="w-full px-2 py-1 border rounded-md text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`auto-response-${detector.id}`}
                    defaultChecked={detector.auto_response_enabled}
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor={`auto-response-${detector.id}`}
                    className="text-sm"
                  >
                    Enable Auto Response
                  </label>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium transition">
                  Save Changes
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
