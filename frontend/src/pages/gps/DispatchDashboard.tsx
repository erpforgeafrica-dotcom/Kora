import { useEffect, useState } from "react";
import { getProviderRoute, getStaffRoster, type ProviderLocationRecord } from "../../services/api";
import type { StaffMember } from "../../types/audience";
import { TrackerMap } from "../../components/gps/TrackerMap";
import { RouteOptimizer } from "../../components/gps/RouteOptimizer";

export default function DispatchDashboard() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [route, setRoute] = useState<ProviderLocationRecord | null>(null);

  useEffect(() => {
    void getStaffRoster().then((result) => {
      setStaff(result.staff);
      setSelectedStaffId(result.staff[0]?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!selectedStaffId) return;
    void getProviderRoute(selectedStaffId).then(setRoute).catch(() => setRoute(null));
  }, [selectedStaffId]);

  return (
    <div style={{ padding: 24, display: "grid", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {staff.slice(0, 6).map((member) => (
          <button key={member.id} onClick={() => setSelectedStaffId(member.id)} style={{ border: "1px solid var(--color-border)", background: selectedStaffId === member.id ? "var(--color-accent)" : "var(--color-surface)", color: selectedStaffId === member.id ? "#041114" : "var(--color-text-primary)", borderRadius: 999, padding: "10px 14px", cursor: "pointer" }}>
            {member.full_name}
          </button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
        <TrackerMap tracking={route} />
        <RouteOptimizer route={route} />
      </div>
    </div>
  );
}
