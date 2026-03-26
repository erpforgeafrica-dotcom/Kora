import PageLayout from "@/components/ui/PageLayout";
import DataTableEnhanced from "@/components/ui/DataTableEnhanced";
import Skeleton from "@/components/ui/Skeleton";
import ActionMenu from "@/components/ui/ActionMenu";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/contexts/KoraToastContext";
import { useState, useEffect } from "react";
import { getPlatformRoles, getPlatformUsers, updatePlatformUserRole, updatePlatformUserStatus, type PlatformRole, type PlatformUser } from "@/services/platformAdmin";

export default function PlatformUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([getPlatformUsers(), getPlatformRoles()])
      .then(([userResult, roleResult]) => {
        setUsers(userResult.users || []);
        setRoles(roleResult || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load users"))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, email: string, status: string) => {
    try {
      const updated = await updatePlatformUserStatus(id, status);
      showToast(`User ${email} marked ${status}`, "success");
      setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, status: updated.status } : user)));
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message}`, "error");
    }
  };

  const handleRoleChange = async (id: string, email: string, roleId: string) => {
    try {
      const nextRole = roles.find((role) => role.id === roleId);
      const updated = await updatePlatformUserRole(id, roleId);
      showToast(`Assigned ${nextRole?.name ?? "role"} to ${email}`, "success");
      setUsers((prev) =>
        prev.map((user) =>
          user.id === id
            ? { ...user, role_id: updated.role_id, role_name: nextRole?.name ?? user.role_name }
            : user
        )
      );
    } catch (err: any) {
      showToast(`Failed to update role: ${err.message}`, "error");
    }
  };

  const filteredData = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.role_name?.toLowerCase().includes(query) ||
      user.role_id?.toLowerCase().includes(query)
    );
  });

  const columns = [
    { 
      accessorKey: "email", 
      header: "Email",
      sortable: true
    },
    { 
      accessorKey: "name", 
      header: "Name",
      sortable: true
    },
    { 
      accessorKey: "role_name", 
      header: "Role",
      sortable: true
    },
    { 
      accessorKey: "status", 
      header: "Status",
      sortable: true,
      cell: ({ row }: any) => <StatusBadge status={row.original.status} />
    },
    { 
      accessorKey: "created_at", 
      header: "Created",
      sortable: true,
      cell: ({ row }: any) => new Date(row.original.created_at).toLocaleDateString()
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => (
        <ActionMenu
          items={[
            {
              label: row.original.status === "suspended" ? "Activate" : "Suspend",
              icon: row.original.status === "suspended" ? "✅" : "⛔",
              variant: row.original.status === "suspended" ? "default" : "danger",
              onClick: () => handleStatusChange(
                row.original.id,
                row.original.email,
                row.original.status === "suspended" ? "active" : "suspended"
              )
            },
            {
              label: "Assign Platform Admin",
              icon: "🔐",
              onClick: () => {
                const role = roles.find((item) => item.name.toLowerCase() === "platform_admin" || item.name.toLowerCase() === "platform admin");
                if (role) {
                  void handleRoleChange(row.original.id, row.original.email, role.id);
                }
              }
            },
            {
              label: "Assign Business Admin",
              icon: "🧭",
              onClick: () => {
                const role = roles.find((item) => item.name.toLowerCase() === "business_admin" || item.name.toLowerCase() === "business admin");
                if (role) {
                  void handleRoleChange(row.original.id, row.original.email, role.id);
                }
              }
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

  return (
    <PageLayout
      title="User Management"
      actions={
        <button 
          style={{
            padding: "10px 16px",
            background: "var(--color-surface-2)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Mono', monospace"
          }}
          onClick={() => window.location.reload()}
        >
          🔄 Refresh
        </button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input 
            placeholder="Search users…" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
              color: "var(--color-text-primary)",
              fontSize: 13,
              width: 300,
              fontFamily: "'DM Mono', monospace"
            }}
          />
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            {roles.length} role definitions loaded from the live platform API.
          </div>
        </div>
      </div>
      
      <DataTableEnhanced 
        columns={columns} 
        data={filteredData} 
      />
    </PageLayout>
  );
}
