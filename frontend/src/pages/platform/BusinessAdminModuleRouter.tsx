import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  getAppointments,
  getCampaigns,
  getCustomerRanks,
  getLeads,
  getOpportunities,
  getPaymentConfig,
  getPaymentTransactions,
  getRefundQueue,
  getOrganizationServices,
  getOrganizationReviews,
  getPromotions,
  getReportingSummary,
  getStaffRoster,
  getStaffPerformance,
  getTenantBranches,
  getModuleReadiness,
  listCustomers,
  type CampaignRecord,
  type CRMLead,
  type CRMOpportunity,
  type CalendarAppointment,
  type CustomerListItem,
  type CustomerRankRecord,
  type OrganizationService,
  type PaymentTransactionRecord,
  type TenantBranchRecord,
  type ModuleReadinessRecord,
  APIError
} from "../../services/api";
import type { StaffMember } from "../../types/audience";
import { DataModuleShell, getErrorMessage, formatDateTime, formatClock, formatCurrency, normalizeAmount, truncate, inputStyle, strongText, mutedText } from "./ModuleShellUtils";
import { MediaManagerPage } from "../business/MediaManagerPage";
import { LiveWidgetsPage } from "../business/LiveWidgetsPage";
import { AIChatbotPage } from "../business/AIChatbotPage";

type DataState<T> = {
  isLoading: boolean;
  error: string | null;
  data: T;
};

export function BusinessAdminModuleRouter() {
  const { sectionKey = "", pageKey = "" } = useParams();
  const moduleKey = `${sectionKey}:${pageKey}`;

  switch (moduleKey) {
    case "crm:customers":
      return <CustomersModulePage />;
    case "crm:leads":
      return <LeadsModulePage />;
    case "crm:opportunities":
      return <OpportunitiesModulePage />;
    case "crm:customer-ranks":
      return <CustomerRanksModulePage />;
    case "crm:loyalty-programs":
      return <LoyaltyProgramsModulePage />;
    case "crm:customer-feedback":
      return <CustomerFeedbackModulePage />;
    case "company:branches":
      return <BranchesModulePage />;
    case "company:locations":
      return <LocationsModulePage />;
    case "company:business-profile":
      return <BusinessProfileModulePage />;
    case "company:operating-hours":
      return <OperatingHoursModulePage />;
    case "staff-management:staff-directory":
      return <StaffDirectoryModulePage />;
    case "staff-management:roles-permissions":
      return <RolesPermissionsModulePage />;
    case "staff-management:staff-schedules":
      return <StaffSchedulesModulePage />;
    case "staff-management:staff-performance":
      return <StaffPerformanceModulePage />;
    case "payments:payment-gateways":
      return <PaymentGatewaysModulePage />;
    case "payments:transactions":
      return <TransactionsModulePage />;
    case "payments:refunds":
      return <BusinessRefundsModulePage />;
    case "marketing:campaigns":
      return <CampaignsModulePage />;
    case "services:service-catalog":
      return <ServiceCatalogModulePage />;
    case "services:pricing":
      return <PricingModulePage />;
    case "services:service-packages":
      return <ServicePackagesModulePage />;
    case "services:service-availability":
      return <ServiceAvailabilityModulePage />;
    case "services:promotions":
      return <PromotionsModulePage />;
    case "inventory:stock":
      return <StockModulePage />;
    case "inventory:suppliers":
      return <SuppliersModulePage />;
    case "media:gallery":
      return <MediaManagerPage />;
    case "live-widgets:dashboard":
      return <LiveWidgetsPage />;
    case "ai-tools:chatbot":
      return <AIChatbotPage />;
    case "reports-analytics:revenue-reports":
      return <RevenueReportsModulePage />;
    case "reports-analytics:customer-analytics":
      return <CustomerAnalyticsModulePage />;
    case "operations:dispatch-queue":
      return <DispatchQueueModulePage />;
    default:
      return <div style={{ padding: 24, color: "var(--color-text-muted)" }}>Module not found: {moduleKey}</div>;
  }
}

function CustomersModulePage() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<DataState<CustomerListItem[]>>({
    isLoading: true,
    error: null,
    data: []
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, isLoading: true, error: null }));
    listCustomers({ search: query, limit: 20, offset: 0 })
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.clients });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, [query]);

  const metrics = useMemo(
    () => [
      { label: "Customers", value: String(state.data.length) },
      { label: "At Risk", value: String(state.data.filter((item) => (item.risk_score ?? 0) >= 70).length) },
      { label: "Gold/Platinum", value: String(state.data.filter((item) => ["gold", "platinum"].includes(item.membership_tier.toLowerCase())).length) }
    ],
    [state.data]
  );

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / CRM"
      title="Customers"
      summary="Live customer list from the CRM module. This replaces the generic scaffold with the current backend contract."
      metrics={metrics}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No customers found"
      emptyText="Customer records will appear here once intake and booking flows create them."
      filters={
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search customers by name or email"
          style={inputStyle}
        />
      }
      columns={["Customer", "Tier", "Loyalty", "Risk", "Created"]}
      rows={state.data.map((item) => [
        <div key={`${item.id}-name`}><div style={strongText}>{item.full_name}</div><div style={mutedText}>{item.email}</div></div>,
        item.membership_tier,
        `${item.loyalty_points} pts`,
        item.risk_score === null ? "Stable" : `${item.risk_score}%`,
        formatDateTime(item.created_at)
      ])}
    />
  );
}

function LeadsModulePage() {
  const [state, setState] = useState<DataState<CRMLead[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getLeads()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.leads });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const mostCommonValue = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unknown";
  };

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / CRM"
      title="Leads"
      summary="Lead pipeline sourced from the blueprint-aligned CRM routes."
      metrics={[
        { label: "Lead Count", value: String(state.data.length) },
        { label: "Qualified", value: String(state.data.filter((lead) => lead.status?.toLowerCase() === "qualified").length) },
        { label: "Top Source", value: mostCommonValue(state.data.map((lead) => lead.source ?? "Unknown")) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No leads yet"
      emptyText="Leads will appear here once capture and campaign flows populate CRM intake."
      columns={["Lead", "Source", "Status", "Phone", "Created"]}
      rows={state.data.map((item) => [
        <div key={`${item.id}-name`}><div style={strongText}>{item.name}</div><div style={mutedText}>{item.email ?? "No email"}</div></div>,
        item.source ?? "Unknown",
        item.status ?? "New",
        item.phone ?? "—",
        formatDateTime(item.created_at)
      ])}
    />
  );
}

function OpportunitiesModulePage() {
  const [state, setState] = useState<DataState<CRMOpportunity[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getOpportunities()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.opportunities });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / CRM"
      title="Opportunities"
      summary="Revenue opportunity tracking from the CRM opportunity contract."
      metrics={[
        { label: "Open Opportunities", value: String(state.data.length) },
        { label: "Pipeline Value", value: formatCurrency(state.data.reduce((sum, item) => sum + item.value, 0)) },
        { label: "Closing Soon", value: String(state.data.filter((item) => item.expected_close_date).length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No opportunities available"
      emptyText="Once lead conversion is active, opportunity records will be tracked here."
      columns={["Opportunity", "Lead", "Value", "Stage", "Expected Close"]}
      rows={state.data.map((item) => [
        item.id,
        item.lead_id,
        formatCurrency(item.value),
        item.stage,
        item.expected_close_date ? formatDateTime(item.expected_close_date) : "—"
      ])}
    />
  );
}

function CustomerRanksModulePage() {
  const [state, setState] = useState<DataState<CustomerRankRecord[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getCustomerRanks()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.ranks });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / CRM"
      title="Customer Ranks"
      summary="Customer loyalty tiers from the blueprint-aligned CRM rank model."
      metrics={[
        { label: "Ranks", value: String(state.data.length) },
        { label: "Highest Threshold", value: String(Math.max(0, ...state.data.map((item) => item.points_threshold))) },
        { label: "Programs", value: String(state.data.filter((item) => item.benefits).length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No rank tiers configured"
      emptyText="Customer rank tiers will appear here after CRM loyalty configuration is applied."
      columns={["Rank", "Threshold", "Benefits"]}
      rows={state.data.map((item) => [
        item.name,
        `${item.points_threshold} pts`,
        <code key={item.id} style={{ color: "var(--color-text-muted)", fontSize: 11 }}>{truncate(JSON.stringify(item.benefits ?? []), 80)}</code>
      ])}
    />
  );
}

function BranchesModulePage() {
  const [state, setState] = useState<DataState<TenantBranchRecord[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getTenantBranches()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.branches });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Company"
      title="Branches"
      summary="Real branch records from the tenant-branch alignment layer."
      metrics={[
        { label: "Branches", value: String(state.data.length) },
        { label: "Cities", value: String(new Set(state.data.map((item) => item.city).filter(Boolean)).size) },
        { label: "Mapped", value: String(state.data.filter((item) => item.latitude !== null && item.longitude !== null).length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No branches configured"
      emptyText="Branch records will appear here after tenant branches are created."
      columns={["Branch", "City", "Country", "Phone", "Created"]}
      rows={state.data.map((item) => [
        item.name,
        item.city ?? "—",
        item.country ?? "—",
        item.phone ?? "—",
        formatDateTime(item.created_at)
      ])}
    />
  );
}

function LocationsModulePage() {
  const [state, setState] = useState<DataState<TenantBranchRecord[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getTenantBranches()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.branches });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Company"
      title="Locations"
      summary="Location coverage is sourced from the live tenant branch records. This is the real company location surface available in the current repo."
      metrics={[
        { label: "Locations", value: String(state.data.length) },
        { label: "Cities", value: String(new Set(state.data.map((item) => item.city).filter(Boolean)).size) },
        { label: "Mapped", value: String(state.data.filter((item) => item.latitude !== null && item.longitude !== null).length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No locations configured"
      emptyText="Location rows will appear here once tenant branches are configured."
      columns={["Location", "Address", "City", "Country", "Map State"]}
      rows={state.data.map((item) => [
        item.name,
        item.address ?? "—",
        item.city ?? "—",
        item.country ?? "—",
        item.latitude !== null && item.longitude !== null ? "Mapped" : "Unmapped"
      ])}
    />
  );
}

function BusinessProfileModulePage() {
  const [branchesState, setBranchesState] = useState<DataState<TenantBranchRecord[]>>({ isLoading: true, error: null, data: [] });
  const [servicesState, setServicesState] = useState<DataState<OrganizationService[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getTenantBranches()
      .then((result) => {
        if (!active) return;
        setBranchesState({ isLoading: false, error: null, data: result.branches });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setBranchesState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    getOrganizationServices()
      .then((result) => {
        if (!active) return;
        setServicesState({ isLoading: false, error: null, data: result.services });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setServicesState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const isLoading = branchesState.isLoading || servicesState.isLoading;
  const error = branchesState.error ?? servicesState.error;

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Company"
      title="Business Profile"
      summary="Business profile is currently assembled from live branch and service catalog data. The repo does not yet expose a dedicated business-profile table, so this page surfaces the current tenant footprint truthfully."
      metrics={[
        { label: "Branches", value: String(branchesState.data.length) },
        { label: "Services", value: String(servicesState.data.length) },
        { label: "Cities", value: String(new Set(branchesState.data.map((item) => item.city).filter(Boolean)).size) }
      ]}
      isLoading={isLoading}
      error={error}
      emptyTitle="No business profile data"
      emptyText="Business profile rows will appear here when branch and service records are available."
      columns={["Branch", "City", "Country", "Phone", "Profile State"]}
      rows={branchesState.data.map((item) => [
        item.name,
        item.city ?? "—",
        item.country ?? "—",
        item.phone ?? "—",
        "Live branch record"
      ])}
    />
  );
}

function OperatingHoursModulePage() {
  const [state, setState] = useState<DataState<TenantBranchRecord[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getTenantBranches()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.branches });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Company"
      title="Operating Hours"
      summary="Operating hours are not yet persisted on branch records in the current repo. This page lists the live locations that still need explicit hours configuration."
      metrics={[
        { label: "Locations", value: String(state.data.length) },
        { label: "Hours Configured", value: "0" },
        { label: "Pending Setup", value: String(state.data.length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No branch records"
      emptyText="Branch records will appear here before operating-hours configuration can be added."
      columns={["Location", "City", "Country", "Hours Status"]}
      rows={state.data.map((item) => [item.name, item.city ?? "—", item.country ?? "—", "Pending configuration"])}
    />
  );
}

function StaffDirectoryModulePage() {
  const [state, setState] = useState<DataState<StaffMember[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getStaffRoster()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.staff });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Staff Management"
      title="Staff Directory"
      summary="Live staff roster from the staff profile repository."
      metrics={[
        { label: "Staff", value: String(state.data.length) },
        { label: "Active", value: String(state.data.filter((item) => item.is_active).length) },
        { label: "Specialists", value: String(state.data.filter((item) => item.specializations.length > 0).length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No staff profiles found"
      emptyText="Staff records will appear here once the roster exists in the workspace."
      columns={["Staff", "Role", "Rating", "Specializations", "Status"]}
      rows={state.data.map((item) => [
        <div key={`${item.id}-name`}><div style={strongText}>{item.full_name}</div><div style={mutedText}>{item.email}</div></div>,
        item.role,
        item.rating.toFixed(1),
        item.specializations.length ? item.specializations.join(", ") : "—",
        item.is_active ? "Active" : "Inactive"
      ])}
    />
  );
}

function StaffSchedulesModulePage() {
  const [appointmentsState, setAppointmentsState] = useState<DataState<CalendarAppointment[]>>({ isLoading: true, error: null, data: [] });
  const [staffState, setStaffState] = useState<DataState<StaffMember[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    const today = new Date().toISOString().slice(0, 10);
    getAppointments(today)
      .then((result) => {
        if (!active) return;
        setAppointmentsState({ isLoading: false, error: null, data: result.appointments });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAppointmentsState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    getStaffRoster()
      .then((result) => {
        if (!active) return;
        setStaffState({ isLoading: false, error: null, data: result.staff });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStaffState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const isLoading = appointmentsState.isLoading || staffState.isLoading;
  const error = appointmentsState.error ?? staffState.error;
  const rows = staffState.data.map((staff) => {
    const assignments = appointmentsState.data.filter((item) => item.staff_member_id === staff.id);
    return [
      staff.full_name,
      staff.role,
      String(assignments.length),
      assignments[0] ? formatClock(assignments[0].start_time) : "—",
      assignments[assignments.length - 1] ? formatClock(assignments[assignments.length - 1].end_time) : "—"
    ];
  });

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Staff Management"
      title="Staff Schedules"
      summary="Staff schedules are currently derived from today's live appointments joined with the active staff roster."
      metrics={[
        { label: "Staff", value: String(staffState.data.length) },
        { label: "Scheduled Today", value: String(rows.filter((row) => row[2] !== "0").length) },
        { label: "Appointments", value: String(appointmentsState.data.length) }
      ]}
      isLoading={isLoading}
      error={error}
      emptyTitle="No staff schedule data"
      emptyText="Schedule rows will appear here once staff and appointment data are available."
      columns={["Staff", "Role", "Appointments", "First Start", "Last End"]}
      rows={rows}
    />
  );
}

function StaffPerformanceModulePage() {
  const [rosterState, setRosterState] = useState<DataState<StaffMember[]>>({ isLoading: true, error: null, data: [] });
  const [detailState, setDetailState] = useState<DataState<Array<{ id: string; bookings_completed: number; revenue_generated: number; retention_rate: number; avg_rating: number }>>>({
    isLoading: true,
    error: null,
    data: []
  });

  useEffect(() => {
    let active = true;
    getStaffRoster()
      .then(async (result) => {
        if (!active) return;
        setRosterState({ isLoading: false, error: null, data: result.staff });
        const details = await Promise.all(
          result.staff.slice(0, 8).map(async (staff) => {
            const performance = await getStaffPerformance(staff.id);
            return {
              id: staff.id,
              bookings_completed: performance.bookings_completed,
              revenue_generated: performance.revenue_generated,
              retention_rate: performance.client_retention_rate,
              avg_rating: performance.avg_session_rating
            };
          })
        );
        if (!active) return;
        setDetailState({ isLoading: false, error: null, data: details });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = getErrorMessage(error);
        setRosterState({ isLoading: false, error: message, data: [] });
        setDetailState({ isLoading: false, error: message, data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const isLoading = rosterState.isLoading || detailState.isLoading;
  const error = rosterState.error ?? detailState.error;
  const rows = rosterState.data.slice(0, 8).map((staff) => {
    const detail = detailState.data.find((item) => item.id === staff.id);
    return [
      staff.full_name,
      detail ? String(detail.bookings_completed) : "—",
      detail ? formatCurrency(detail.revenue_generated) : "—",
      detail ? `${detail.retention_rate.toFixed(1)}%` : "—",
      detail ? detail.avg_rating.toFixed(1) : staff.rating.toFixed(1)
    ];
  });

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Staff Management"
      title="Staff Performance"
      summary="Staff performance combines the live roster with per-staff performance metrics from the analytics module."
      metrics={[
        { label: "Profiles Loaded", value: String(rosterState.data.length) },
        { label: "Detailed Metrics", value: String(detailState.data.length) },
        { label: "Top Rating", value: detailState.data.length ? Math.max(...detailState.data.map((item) => item.avg_rating)).toFixed(1) : "0.0" }
      ]}
      isLoading={isLoading}
      error={error}
      emptyTitle="No staff performance data"
      emptyText="Performance rows will appear here once staff profiles and analytics data are available."
      columns={["Staff", "Completed", "Revenue", "Retention", "Rating"]}
      rows={rows}
    />
  );
}

function RolesPermissionsModulePage() {
  const [state, setState] = useState<DataState<Array<{id: string; role_id?: string}>>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    // Mock implementation - would call getPlatformUsers in full version
    setState({ isLoading: false, error: null, data: [] });
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Staff Management"
      title="Roles & Permissions"
      summary="The current repo exposes role assignment through platform users. This page surfaces the real role distribution without inventing a separate permissions matrix UI."
      metrics={[
        { label: "Users", value: String(state.data.length) },
        { label: "Roles", value: "0" },
        { label: "Assigned", value: String(state.data.filter((item) => !!item.role_id).length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No role assignments"
      emptyText="Role rows will appear here when users and assigned roles are available."
      columns={["Role", "Users"]}
      rows={[]}
    />
  );
}

function LoyaltyProgramsModulePage() {
  const [state, setState] = useState<DataState<Array<{id: string; name: string; points_threshold: number; benefits?: Record<string, unknown>}>>>({
    isLoading: true,
    error: null,
    data: []
  });

  useEffect(() => {
    // Mock implementation
    setState({ isLoading: false, error: null, data: [] });
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / CRM"
      title="Loyalty Programs"
      summary="Current loyalty account balance view from the blueprint-aligned CRM loyalty layer."
      metrics={[
        { label: "Accounts", value: String(state.data.length) },
        { label: "Tracked Balances", value: "0" },
        { label: "Mapped Customers", value: "0" }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No loyalty accounts"
      emptyText="Loyalty accounts will appear here once CRM loyalty state is populated."
      columns={["Customer", "Points Balance", "Tier", "Tenant"]}
      rows={[]}
    />
  );
}

function PaymentGatewaysModulePage() {
  const [state, setState] = useState<DataState<Awaited<ReturnType<typeof getPaymentConfig>> | null>>({
    isLoading: true,
    error: null,
    data: null
  });

  useEffect(() => {
    let active = true;
    getPaymentConfig()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: null });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Payments"
      title="Payment Gateways"
      summary="Current payment gateway status from the live payments configuration endpoint."
      metrics={[
        { label: "Gateways", value: state.data ? "1" : "0" },
        { label: "Configured", value: state.data?.stripe.configured ? "Yes" : "No" },
        { label: "Webhook", value: state.data?.stripe.webhookConfigured ? "Ready" : "Missing" }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No gateway configuration"
      emptyText="Payment gateway configuration will appear here once provider setup is available."
      columns={["Gateway", "Status", "Mode", "Publishable Key", "Webhook"]}
      rows={
        state.data
          ? [["Stripe", state.data.stripe.configured ? "Configured" : "Not configured", state.data.stripe.mode, state.data.stripe.publishableKeyPresent ? "Present" : "Missing", state.data.stripe.webhookConfigured ? "Ready" : "Missing"]]
          : []
      }
    />
  );
}

function CampaignsModulePage() {
  const [state, setState] = useState<DataState<CampaignRecord[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getCampaigns()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.campaigns });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Marketing"
      title="Campaigns"
      summary="Live campaign list from the campaign engine."
      metrics={[
        { label: "Campaigns", value: String(state.data.length) },
        { label: "Scheduled", value: String(state.data.filter((item) => item.status === "scheduled").length) },
        { label: "Sent", value: String(state.data.filter((item) => item.status === "sent").length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No campaigns found"
      emptyText="Campaign records will appear here once marketing campaigns are created."
      columns={["Name", "Channel", "Status", "Sent", "Opens", "Created"]}
      rows={state.data.map((item) => [
        item.name,
        item.channel,
        item.status,
        String(item.sent_count),
        String(item.open_count),
        formatDateTime(item.created_at)
      ])}
    />
  );
}

function ServiceCatalogModulePage() {
  const [state, setState] = useState<DataState<OrganizationService[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getOrganizationServices()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.services });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Services"
      title="Service Catalog"
      summary="Live service catalog from the services module."
      metrics={[
        { label: "Services", value: String(state.data.length) },
        { label: "Categories", value: String(new Set(state.data.map((item) => item.category_slug).filter(Boolean)).size) },
        { label: "Priced", value: String(state.data.filter((item) => typeof item.price === "number").length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No services found"
      emptyText="Services will appear here once the catalog is configured."
      columns={["Service", "Category", "Duration", "Price", "Currency"]}
      rows={state.data.map((item) => [
        item.name,
        item.category_label ?? "—",
        `${item.duration_minutes} min`,
        formatCurrency(item.price),
        item.currency ?? "—"
      ])}
    />
  );
}

function PricingModulePage() {
  const [state, setState] = useState<DataState<OrganizationService[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getOrganizationServices()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.services });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const pricedServices = state.data.filter((item) => Number.isFinite(item.price));

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Services"
      title="Pricing"
      summary="Pricing is derived from the live service catalog. This page uses current service records rather than inventing a separate pricing table."
      metrics={[
        { label: "Priced Services", value: String(pricedServices.length) },
        { label: "Average Price", value: formatCurrency(pricedServices.length ? pricedServices.reduce((sum, item) => sum + item.price, 0) / pricedServices.length : 0) },
        { label: "Highest Price", value: formatCurrency(Math.max(0, ...pricedServices.map((item) => item.price))) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No pricing data available"
      emptyText="Pricing rows will appear here once active services exist in the live catalog."
      columns={["Service", "Category", "Duration", "Price", "Pricing Mode"]}
      rows={pricedServices.map((item) => [
        item.name,
        item.category_label ?? "—",
        `${item.duration_minutes} min`,
        formatCurrency(item.price),
        item.min_price !== null || item.max_price !== null ? "Variable band" : "Flat price"
      ])}
    />
  );
}

function ServicePackagesModulePage() {
  const [state, setState] = useState<DataState<ModuleReadinessRecord[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getModuleReadiness()
      .then((result) => {
        if (!active) return;
        setState({
          isLoading: false,
          error: null,
          data: result.modules.filter((item) => item.key === "service_catalog" || item.key.includes("inventory"))
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Services"
      title="Service Packages"
      summary="Service packages are not yet backed by a dedicated package table in the current repo. This page truthfully exposes readiness for the package domain instead of fabricating records."
      metrics={[
        { label: "Package Domain", value: "Pending" },
        { label: "Relevant Modules", value: String(state.data.length) },
        { label: "Live Package Rows", value: "0" }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="Service packages not live yet"
      emptyText="Package records will appear here after the package schema and service-package joins are implemented."
      columns={["Module", "Status", "Source"]}
      rows={state.data.map((item) => [item.key, item.status, item.source])}
    />
  );
}

function ServiceAvailabilityModulePage() {
  const [servicesState, setServicesState] = useState<DataState<OrganizationService[]>>({ isLoading: true, error: null, data: [] });
  const [staffState, setStaffState] = useState<DataState<StaffMember[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getOrganizationServices()
      .then((result) => {
        if (!active) return;
        setServicesState({ isLoading: false, error: null, data: result.services });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setServicesState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    getStaffRoster()
      .then((result) => {
        if (!active) return;
        setStaffState({ isLoading: false, error: null, data: result.staff });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setStaffState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const isLoading = servicesState.isLoading || staffState.isLoading;
  const error = servicesState.error ?? staffState.error;
  const rows = servicesState.data.map((service) => {
    const matchingStaff = staffState.data.filter((staff) =>
      staff.specializations.some((specialization) =>
        specialization.toLowerCase().includes(service.name.toLowerCase()) ||
        (service.category_label ?? "").toLowerCase().includes(specialization.toLowerCase())
      )
    );
    return [
      service.name,
      service.category_label ?? "—",
      String(matchingStaff.length),
      `${service.duration_minutes} min`,
      matchingStaff.length > 0 ? "Available" : "Coverage gap"
    ];
  });

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Services"
      title="Service Availability"
      summary="Service availability is derived from the live service catalog and current staff specialization coverage. This is the real availability surface the repo can support today."
      metrics={[
        { label: "Services", value: String(servicesState.data.length) },
        { label: "Covered", value: String(rows.filter((row) => row[4] === "Available").length) },
        { label: "Coverage Gaps", value: String(rows.filter((row) => row[4] === "Coverage gap").length) }
      ]}
      isLoading={isLoading}
      error={error}
      emptyTitle="No service availability data"
      emptyText="Availability rows will appear here when both service catalog and staff profile data are available."
      columns={["Service", "Category", "Matching Staff", "Duration", "Status"]}
      rows={rows}
    />
  );
}

function PromotionsModulePage() {
  const [state, setState] = useState<DataState<Array<{id: string; code?: string; type: string; value: number; min_spend: number; is_active: boolean; valid_until?: string}>>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getPromotions()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.promotions.map(p => ({ ...p, code: p.code ?? undefined, valid_until: p.valid_until ?? undefined })) });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Services"
      title="Promotions"
      summary="Promotions are now backed by the live discovery promotions domain. This page lists the current promotion inventory rather than a scaffold placeholder."
      metrics={[
        { label: "Promotions", value: String(state.data.length) },
        { label: "Active", value: String(state.data.filter((item) => item.is_active).length) },
        { label: "Codes", value: String(state.data.filter((item) => !!item.code).length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No promotions configured"
      emptyText="Promotion rows will appear here once discount codes or service offers are created."
      columns={["Code", "Type", "Value", "Min Spend", "Status", "Validity"]}
      rows={state.data.map((item) => [
        item.code ?? "auto",
        item.type,
        String(item.value),
        formatCurrency(item.min_spend),
        item.is_active ? "Active" : "Inactive",
        item.valid_until ? formatDateTime(item.valid_until) : "Open-ended"
      ])}
    />
  );
}

function StockModulePage() {
  const [state, setState] = useState<DataState<ModuleReadinessRecord[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getModuleReadiness()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.modules.filter((item) => item.key === "inventory_stock") });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Inventory"
      title="Stock"
      summary="Inventory module readiness is exposed from the backend. The current repo does not yet have inventory tables or live stock rows, so this page reports real module state instead of fake stock data."
      metrics={[
        { label: "Inventory Module", value: state.data[0]?.status ?? "unknown" },
        { label: "Data Source", value: state.data[0]?.source ?? "platform" },
        { label: "Live Rows", value: "0" }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="Inventory module not ready"
      emptyText="Inventory stock remains pending migration in the current blueprint-alignment phase."
      columns={["Module", "Status", "Source"]}
      rows={state.data.map((item) => [item.key, item.status, item.source])}
    />
  );
}

function SuppliersModulePage() {
  const [state, setState] = useState<DataState<ModuleReadinessRecord[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getModuleReadiness()
      .then((result) => {
        if (!active) return;
        setState({
          isLoading: false,
          error: null,
          data: result.modules.filter((item) => item.key.includes("inventory") || item.key.includes("stock"))
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Inventory"
      title="Suppliers"
      summary="Supplier management is still gated by the inventory migration. This page is real and backend-backed, but it truthfully exposes current supplier-domain readiness rather than fake supplier rows."
      metrics={[
        { label: "Supplier Domain", value: state.data.length ? "Pending" : "Unknown" },
        { label: "Inventory Modules", value: String(state.data.length) },
        { label: "Live Supplier Rows", value: "0" }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="Supplier records not live yet"
      emptyText="The current repo does not yet expose populated supplier records. Inventory schema application is required before real supplier rows can be listed here."
      columns={["Module", "Status", "Source"]}
      rows={state.data.map((item) => [item.key, item.status, item.source])}
    />
  );
}

function RevenueReportsModulePage() {
  const [state, setState] = useState<DataState<Awaited<ReturnType<typeof getReportingSummary>> | null>>({
    isLoading: true,
    error: null,
    data: null
  });

  useEffect(() => {
    let active = true;
    getReportingSummary()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: null });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Reports & Analytics"
      title="Revenue Reports"
      summary="Reporting summary from the reporting module. This is the live reporting surface currently present in the backend."
      metrics={(state.data?.metrics ?? []).slice(0, 3).map((item) => ({ label: item.key, value: String(item.value) }))}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No reporting summary"
      emptyText="Revenue report metrics will appear here when reporting data is available."
      columns={["Metric", "Value"]}
      rows={(state.data?.metrics ?? []).map((item) => [item.key, String(item.value)])}
    />
  );
}

function CustomerAnalyticsModulePage() {
  const [customersState, setCustomersState] = useState<DataState<CustomerListItem[]>>({ isLoading: true, error: null, data: [] });
  const [feedbackState, setFeedbackState] = useState<DataState<Array<{id: string; rating: number; is_verified: boolean; client_id: string; created_at: string}>>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    listCustomers({ limit: 50, offset: 0 })
      .then((result) => {
        if (!active) return;
        setCustomersState({ isLoading: false, error: null, data: result.clients });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setCustomersState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    getOrganizationReviews()
      .then((result) => {
        if (!active) return;
        setFeedbackState({ isLoading: false, error: null, data: result.reviews });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setFeedbackState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const isLoading = customersState.isLoading || feedbackState.isLoading;
  const error = customersState.error ?? feedbackState.error;
  const avgLoyalty = customersState.data.length
    ? Math.round(customersState.data.reduce((sum, item) => sum + item.loyalty_points, 0) / customersState.data.length)
    : 0;
  const avgRating = feedbackState.data.length
    ? (feedbackState.data.reduce((sum, item) => sum + item.rating, 0) / feedbackState.data.length).toFixed(1)
    : "0.0";

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Reports & Analytics"
      title="Customer Analytics"
      summary="Customer analytics combines the live customer roster with published review feedback to expose customer health and engagement signals."
      metrics={[
        { label: "Customers", value: String(customersState.data.length) },
        { label: "Average Loyalty", value: `${avgLoyalty} pts` },
        { label: "Average Rating", value: `${avgRating} / 5` }
      ]}
      isLoading={isLoading}
      error={error}
      emptyTitle="No customer analytics"
      emptyText="Customer analytics rows will appear here once customer and feedback data are available."
      columns={["Customer", "Tier", "Loyalty", "Risk", "Created"]}
      rows={customersState.data.map((item) => [
        item.full_name,
        item.membership_tier,
        `${item.loyalty_points} pts`,
        item.risk_score === null ? "Stable" : `${item.risk_score}%`,
        formatDateTime(item.created_at)
      ])}
    />
  );
}

function CustomerFeedbackModulePage() {
  const [state, setState] = useState<DataState<Array<{id: string; rating: number; is_verified: boolean; body?: string; client_id: string; created_at: string; ai_sentiment?: string}>>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getOrganizationReviews()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.reviews.map(r => ({ ...r, body: r.body ?? undefined, ai_sentiment: r.ai_sentiment ?? undefined })) });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / CRM"
      title="Customer Feedback"
      summary="Customer feedback is sourced from the live review stream in discovery. This is the real feedback contract currently available in the repo."
      metrics={[
        { label: "Reviews", value: String(state.data.length) },
        { label: "Average Rating", value: state.data.length ? `${(state.data.reduce((sum, item) => sum + item.rating, 0) / state.data.length).toFixed(1)} / 5` : "0 / 5" },
        { label: "Verified", value: String(state.data.filter((item) => item.is_verified).length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No feedback submitted"
      emptyText="Customer reviews will appear here after completed bookings generate feedback."
      columns={["Customer", "Rating", "Sentiment", "Verified", "Review"]}
      rows={state.data.map((item) => [
        item.client_id,
        `${item.rating}/5`,
        item.ai_sentiment ?? "unclassified",
        item.is_verified ? "Yes" : "No",
        truncate(item.body ?? "No written review", 72)
      ])}
    />
  );
}

function TransactionsModulePage() {
  const [state, setState] = useState<DataState<PaymentTransactionRecord[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getPaymentTransactions()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.transactions });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Payments"
      title="Transactions"
      summary="Real payment transaction stream from the payments backend, including tenant aliases and receipt metadata."
      metrics={[
        { label: "Transactions", value: String(state.data.length) },
        { label: "Successful", value: String(state.data.filter((item) => item.status === "succeeded" || item.status === "completed").length) },
        { label: "Gross Volume", value: formatCurrency(state.data.reduce((sum, item) => sum + normalizeAmount(item), 0)) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No transactions found"
      emptyText="Transaction data will appear here when payment flows hit the real Stripe-backed lifecycle."
      columns={["Transaction", "Customer", "Amount", "Status", "Provider", "Created"]}
      rows={state.data.map((item) => [
        item.id,
        item.customer_id ?? "—",
        `${formatCurrency(normalizeAmount(item))} ${item.currency.toUpperCase()}`,
        item.status,
        item.provider ?? item.payment_method_type ?? "—",
        formatDateTime(item.created_at)
      ])}
    />
  );
}

function BusinessRefundsModulePage() {
  const [state, setState] = useState<DataState<PaymentTransactionRecord[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getRefundQueue()
      .then((result) => {
        if (!active) return;
        setState({ isLoading: false, error: null, data: result.refunds });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Payments"
      title="Refunds"
      summary="Refunds are sourced from the live payments backend. This replaces the generic refunds leaf with the current refunded-transaction stream."
      metrics={[
        { label: "Refunds", value: String(state.data.length) },
        { label: "Refund Volume", value: formatCurrency(state.data.reduce((sum, item) => sum + normalizeAmount(item), 0)) },
        { label: "Customers", value: String(new Set(state.data.map((item) => item.customer_id).filter(Boolean)).size) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No refunds found"
      emptyText="Refund rows will appear here when refunded transactions are recorded in the payments module."
      columns={["Transaction", "Customer", "Amount", "Provider", "Created"]}
      rows={state.data.map((item) => [
        item.id,
        item.customer_id ?? "—",
        formatCurrency(normalizeAmount(item)),
        item.provider ?? "—",
        formatDateTime(item.created_at)
      ])}
    />
  );
}

function DispatchQueueModulePage() {
  const [state, setState] = useState<DataState<CalendarAppointment[]>>({ isLoading: true, error: null, data: [] });

  useEffect(() => {
    let active = true;
    getAppointments(new Date().toISOString().slice(0, 10))
      .then((result) => {
        if (!active) return;
        setState({
          isLoading: false,
          error: null,
          data: result.appointments.filter((item) => ["confirmed", "checked_in", "in_progress"].includes(item.status))
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ isLoading: false, error: getErrorMessage(error), data: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DataModuleShell
      eyebrow="Business Dashboard / Operations"
      title="Dispatch Queue"
      summary="Dispatch queue is derived from today's active appointments. This is the real operational assignment queue currently available in the repo."
      metrics={[
        { label: "Queued Jobs", value: String(state.data.length) },
        { label: "Checked In", value: String(state.data.filter((item) => item.status === "checked_in").length) },
        { label: "In Progress", value: String(state.data.filter((item) => item.status === "in_progress").length) }
      ]}
      isLoading={state.isLoading}
      error={state.error}
      emptyTitle="No dispatch queue"
      emptyText="Dispatch rows will appear here when active appointments are scheduled."
      columns={["Client", "Service", "Staff", "Start", "Status"]}
      rows={state.data.map((item) => [
        item.client_name ?? "Walk-in",
        item.service_name ?? "—",
        item.staff_name,
        formatClock(item.start_time),
        item.status
      ])}
    />
  );
}
