import { useNavigate } from "react-router-dom";
import PageLayout from "@/components/ui/PageLayout";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import ActionMenu from "@/components/ui/ActionMenu";
import { useToast } from "@/contexts/KoraToastContext";
import { useState, useEffect } from "react";

interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
}

export default function LocationsListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tenant/branches")
      .then((res) => res.json())
      .then((data) => setLocations(data.branches || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete ${name}? This action cannot be undone.`)) return;
    
    try {
      await fetch(`/api/tenant/branches/${id}`, { method: "DELETE" });
      showToast(`${name} deleted successfully`, "success");
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
    } catch (err: any) {
      showToast(`Failed to delete: ${err.message}`, "error");
    }
  };

  const columns = [
    { 
      accessorKey: "name", 
      header: "Location Name",
      sortable: true
    },
    { 
      accessorKey: "city", 
      header: "City",
      sortable: true
    },
    { 
      accessorKey: "country", 
      header: "Country",
      sortable: true
    },
    { 
      accessorKey: "phone", 
      header: "Phone"
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <ActionMenu
          items={[
            {
              label: "Edit",
              icon: "✏️",
              onClick: () => navigate(`/app/business-admin/locations/${row.original.id}/edit`)
            },
            {
              label: "Delete",
              icon: "🗑",
              variant: "danger",
              onClick: () => handleDelete(row.original.id, row.original.name)
            }
          ]}
        />
      ),
    },
  ];

  if (loading) return <Skeleton rows={8} />;
  if (error) return (
    <div style={{ padding: 24 }}>
      <div style={{ 
        padding: 16, 
        background: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
        border: "1px solid var(--color-danger)",
        borderRadius: 12,
        color: "var(--color-danger)",
        fontSize: 14
      }}>
        Error: {error}
      </div>
    </div>
  );
  
  if (!locations.length) return (
    <EmptyState
      message="No Locations yet"
      action={{ label: "+ New Location", onClick: () => navigate("/app/business-admin/locations/create") }}
    />
  );

  return (
    <PageLayout
      title="Locations"
      actions={
        <button 
          style={{
            padding: "10px 16px",
            background: "var(--color-accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace"
          }}
          onClick={() => navigate("/app/business-admin/locations/create")}
        >
          + New Location
        </button>
      }
    >
      <DataTableEnhanced 
        columns={columns} 
        data={locations} 
      />
    </PageLayout>
  );
}
