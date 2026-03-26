export type UserRole =
  | "client"
  | "staff"
  | "business_admin"
  | "operations"
  | "kora_admin"
  | "platform_admin"
  | "inventory_manager"
  | "sales_manager"
  | "sales_agent"
  | "dispatcher"
  | "delivery_agent"
  | "doctor"
  | "nurse"
  | "pharmacist"
  | "lab_scientist"
  | "caregiver";

export interface NavChild {
  label: string;
  path: string;
  badge?: string;
  hidden?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  icon: string;
  overviewPath: string;
  description: string;
  hidden?: boolean;
  children: NavChild[];
}

// ─── TENANT OPERATIONS ───────────────────────────────────────────────────────
const tenantOperationsSection: NavSection = {
  id: "tenant-ops",
  title: "Tenant Operations",
  icon: "building",
  overviewPath: "/app/business-admin",
  description: "Bookings, clients, staff, services, payments, inventory, CRM, and reviews.",
  children: [
    { label: "Overview",   path: "/app/business-admin" },
    { label: "Bookings",   path: "/app/business-admin/bookings" },
    { label: "Clients",    path: "/app/business-admin/clients" },
    { label: "Services",   path: "/app/business-admin/services" },
    { label: "Staff",      path: "/app/business-admin/staff" },
    { label: "Payments",   path: "/app/business-admin/payments" },
    { label: "Inventory",  path: "/app/business-admin/inventory" },
    { label: "CRM",        path: "/app/business-admin/crm" },
    { label: "Reviews",    path: "/app/business-admin/reviews" },
    { label: "Marketing",  path: "/app/business-admin/marketing" },
    { label: "Locations",  path: "/app/business-admin/locations" },
  ],
};

// ─── CLINICAL & CARE ─────────────────────────────────────────────────────────
const clinicalSection: NavSection = {
  id: "clinical",
  title: "Clinical & Care",
  icon: "activity",
  overviewPath: "/app/clinical",
  description: "Patient records, appointments, prescriptions, lab, and care workflows.",
  children: [
    { label: "Overview",       path: "/app/clinical" },
    { label: "Patients",       path: "/app/clinical/patients" },
    { label: "Appointments",   path: "/app/clinical/appointments" },
    { label: "Care Notes",     path: "/app/clinical/notes" },
    { label: "Prescriptions",  path: "/app/clinical/prescriptions" },
    { label: "Lab Requests",   path: "/app/clinical/lab" },
    { label: "Pharmacy",       path: "/app/clinical/pharmacy" },
    { label: "Follow-ups",     path: "/app/clinical/followups" },
  ],
};

// ─── EMERGENCY & DISPATCH ────────────────────────────────────────────────────
const emergencySection: NavSection = {
  id: "emergency",
  title: "Emergency & Dispatch",
  icon: "alert",
  overviewPath: "/app/emergency",
  description: "Incident intake, dispatch, live tracking, and closure reporting.",
  children: [
    { label: "Live Board",     path: "/app/emergency" },
    { label: "New Request",    path: "/app/emergency/new" },
    { label: "Active Cases",   path: "/app/emergency/active" },
    { label: "Dispatch Units", path: "/app/emergency/units" },
    { label: "Resolved",       path: "/app/emergency/resolved" },
    { label: "Reports",        path: "/app/emergency/reports" },
  ],
};

// ─── DELIVERY & MOBILITY ─────────────────────────────────────────────────────
const deliverySection: NavSection = {
  id: "delivery",
  title: "Delivery & Mobility",
  icon: "truck",
  overviewPath: "/app/delivery",
  description: "Delivery bookings, rider availability, dispatch, tracking, and completion.",
  children: [
    { label: "Overview",       path: "/app/delivery" },
    { label: "Bookings",       path: "/app/delivery/bookings" },
    { label: "Dispatch Board", path: "/app/operations/dispatch-dashboard" },
    { label: "Riders / Agents",path: "/app/delivery/agents" },
    { label: "Live Tracking",  path: "/app/delivery/tracking" },
    { label: "Completed",      path: "/app/delivery/completed" },
  ],
};

// ─── MONITORING & AI ─────────────────────────────────────────────────────────
const monitoringSection: NavSection = {
  id: "monitoring",
  title: "Monitoring & AI",
  icon: "activity",
  overviewPath: "/app/insights",
  description: "AI orchestration, anomaly detection, recommendations, and system health.",
  children: [
    { label: "Overview",          path: "/app/insights" },
    { label: "AI Insights",       path: "/app/business-admin/ai-insights" },
    { label: "Anomaly Feed",      path: "/app/insights/anomalies",      hidden: true },
    { label: "Recommendations",   path: "/app/insights/recommendations", hidden: true },
    { label: "Marketplace Intel", path: "/app/business-admin/marketplace" },
    { label: "Reports",           path: "/app/reports",                  hidden: true },
  ],
};

// ─── SUPPORT ─────────────────────────────────────────────────────────────────
const supportSection: NavSection = {
  id: "support",
  title: "Support",
  icon: "headset",
  overviewPath: "/app/operations/support",
  description: "Support queue, escalations, and resolved ticket management.",
  children: [
    { label: "Queue",       path: "/app/operations/support" },
    { label: "Escalations", path: "/app/operations/support?view=escalations" },
    { label: "Resolved",    path: "/app/operations/support?view=resolved" },
  ],
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
const settingsSection: NavSection = {
  id: "settings",
  title: "Settings",
  icon: "settings",
  overviewPath: "/app/settings",
  description: "Organization, users, security, billing, AI, integrations, and governance.",
  children: [
    { label: "Overview",           path: "/app/settings" },
    { label: "Organization",       path: "/app/settings?section=organization" },
    { label: "Users & Roles",      path: "/app/settings?section=users-roles" },
    { label: "Security",           path: "/app/settings?section=security" },
    { label: "Billing",            path: "/app/settings?section=billing" },
    { label: "Notifications",      path: "/app/settings?section=notifications" },
    { label: "Workflow Rules",     path: "/app/settings?section=workflow-rules" },
    { label: "Feature Flags",      path: "/app/settings?section=feature-flags" },
    { label: "AI Controls",        path: "/app/settings?section=ai-settings" },
    { label: "Integrations",       path: "/app/settings?section=integrations" },
    { label: "Preferences",        path: "/app/settings?section=preferences" },
    { label: "Audit & Governance", path: "/app/settings?section=audit-governance" },
  ],
};

// ─── PLATFORM (platform_admin only) ──────────────────────────────────────────
const platformSection: NavSection = {
  id: "platform",
  title: "Platform",
  icon: "globe",
  overviewPath: "/app/kora-admin/tenants",
  description: "Tenant management, subscriptions, users, feature flags, and platform revenue.",
  children: [
    { label: "Tenants",       path: "/app/kora-admin/tenants" },
    { label: "Subscriptions", path: "/app/kora-admin/subscriptions" },
    { label: "Users",         path: "/app/kora-admin/users" },
    { label: "Feature Flags", path: "/app/kora-admin/features" },
    { label: "Revenue",       path: "/app/kora-admin/revenue" },
    { label: "AI Usage",      path: "/app/kora-admin/ai-usage" },
    { label: "Support Queue", path: "/app/kora-admin/support" },
  ],
};

// ─── BLOG / CONTENT ──────────────────────────────────────────────────────────
const contentSection: NavSection = {
  id: "content",
  title: "Content",
  icon: "globe",
  overviewPath: "/app/content",
  description: "Blog authoring, moderation, publishing, and content governance.",
  children: [
    { label: "All Articles",  path: "/app/content" },
    { label: "New Article",   path: "/app/content/new" },
    { label: "Drafts",        path: "/app/content?status=draft" },
    { label: "Pending Review",path: "/app/content?status=pending_review" },
    { label: "Published",     path: "/app/content?status=published" },
    { label: "Retracted",     path: "/app/content?status=retracted" },
  ],
};

// ─── ROLE MAPS ────────────────────────────────────────────────────────────────
const businessAdminNav: NavSection[] = [
  tenantOperationsSection,
  clinicalSection,
  emergencySection,
  deliverySection,
  monitoringSection,
  supportSection,
  settingsSection,
  contentSection,
];

const operationsNav: NavSection[] = [
  deliverySection,
  emergencySection,
  supportSection,
  monitoringSection,
];

const platformAdminNav: NavSection[] = [
  platformSection,
  tenantOperationsSection,
  monitoringSection,
  supportSection,
  settingsSection,
];

const clinicalNav: NavSection[] = [
  clinicalSection,
  tenantOperationsSection,
  settingsSection,
];

const dispatcherNav: NavSection[] = [
  emergencySection,
  deliverySection,
  supportSection,
];

const staffNav: NavSection[] = [
  {
    id: "my-workspace",
    title: "My Workspace",
    icon: "user",
    overviewPath: "/app/staff",
    description: "Your schedule, assigned jobs, and client interactions.",
    children: [
      { label: "Today",     path: "/app/staff" },
      { label: "Schedule",  path: "/app/staff/schedule" },
      { label: "Clients",   path: "/app/staff/clients" },
      { label: "Tasks",     path: "/app/staff/tasks" },
    ],
  },
];

export const navigation: Record<UserRole, NavSection[]> = {
  client:           [],
  staff:            staffNav,
  business_admin:   businessAdminNav,
  operations:       operationsNav,
  kora_admin:       platformAdminNav,
  platform_admin:   platformAdminNav,
  inventory_manager: [tenantOperationsSection, settingsSection],
  sales_manager:    [tenantOperationsSection, monitoringSection, settingsSection],
  sales_agent:      [tenantOperationsSection],
  dispatcher:       dispatcherNav,
  delivery_agent:   [deliverySection],
  doctor:           clinicalNav,
  nurse:            clinicalNav,
  pharmacist:       [clinicalSection, settingsSection],
  lab_scientist:    [clinicalSection],
  caregiver:        [clinicalSection],
};

export function getNavigationForRole(role: UserRole): NavSection[] {
  return navigation[role] ?? [];
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  const sections = getNavigationForRole(role);
  return sections
    .flatMap((s) => s.children)
    .some((c) => !c.hidden && c.path.split("?")[0] === path.split("?")[0]);
}
