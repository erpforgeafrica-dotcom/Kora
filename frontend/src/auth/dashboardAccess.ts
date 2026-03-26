export type DashboardRole =
  | "client"
  | "staff"
  | "business_admin"
  | "operations"
  | "platform_admin"
  | "kora_admin"
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

const ROLE_ALIASES: Record<string, DashboardRole> = {
  client: "client",
  customer: "client",
  staff: "staff",
  therapist: "staff",
  receptionist: "staff",
  business_admin: "business_admin",
  "business-admin": "business_admin",
  owner: "business_admin",
  manager: "business_admin",
  admin: "business_admin",
  operations: "operations",
  dispatcher: "dispatcher",
  support: "operations",
  "delivery-agent": "delivery_agent",
  delivery_agent: "delivery_agent",
  courier: "delivery_agent",
  rider: "delivery_agent",
  inventory_manager: "inventory_manager",
  "inventory-manager": "inventory_manager",
  sales_manager: "sales_manager",
  "sales-manager": "sales_manager",
  sales_agent: "sales_agent",
  "sales-agent": "sales_agent",
  platform_admin: "platform_admin",
  "platform-admin": "platform_admin",
  kora_admin: "platform_admin",
  "kora-admin": "platform_admin",
  kora_superadmin: "platform_admin",
  doctor: "doctor",
  nurse: "nurse",
  pharmacist: "pharmacist",
  lab_scientist: "lab_scientist",
  "lab-scientist": "lab_scientist",
  caregiver: "caregiver",
};

export function normalizeDashboardRole(input: string | null | undefined): DashboardRole | null {
  if (!input) return null;
  return ROLE_ALIASES[input.trim().toLowerCase()] ?? null;
}

export function getFallbackDashboardRole(): DashboardRole {
  const envRole = import.meta.env.VITE_DASHBOARD_ROLE as string | undefined;
  return normalizeDashboardRole(envRole) ?? "platform_admin";
}

export function getDefaultDashboardPath(role: DashboardRole): string {
  switch (role) {
    case "client":
      return "/app/client";
    case "staff":
      return "/app/staff";
    case "inventory_manager":
      return "/app/business-admin/inventory";
    case "sales_manager":
    case "sales_agent":
      return "/app/business-admin/leads";
    case "dispatcher":
    case "delivery_agent":
      return "/app/operations/delivery/bookings";
    case "doctor":
    case "nurse":
    case "pharmacist":
    case "lab_scientist":
    case "caregiver":
      return "/app/clinical";
    case "business_admin":
      return "/app/business-admin";
    case "operations":
      return "/app/operations";
    case "kora_admin":
    case "platform_admin":
    default:
      return "/app/kora-admin/tenants";
  }
}

export function canAccessDashboard(role: DashboardRole, allowedRoles: DashboardRole[]) {
  return allowedRoles.includes(role);
}
