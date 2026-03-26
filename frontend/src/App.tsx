import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { DashboardRouteGuard, DefaultDashboardRedirect } from "./components/auth/DashboardRouteGuard";
import AppShell from "./components/layout/AppShell";
import CommandPalette from "./components/CommandPalette";
import { useQueryErrorHandler } from "./hooks/useQueryErrorHandler";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ClinicalModule } from "./pages/audience/ClinicalModule";
import { EmergencyModule } from "./pages/audience/EmergencyModule";
import { FinanceCenter } from "./pages/audience/FinanceCenter";
import { AIInsightsDashboard } from "./pages/audience/AIInsightsDashboard";
import { ReportsCenter } from "./pages/audience/ReportsCenter";
import { ForbiddenPage } from "./pages/audience/ForbiddenPage";
import { DeliveryModule } from "./pages/delivery/DeliveryModule";
import { ContentModule } from "./pages/content/ContentModule";

import StubPage from "./pages/StubPage";
import LoginPage from "./pages/LoginPage";

const S = (title: string) => () => <StubPage title={title} />;

// ── Stub pages for unbuilt routes ─────────────────────────────────────────────
const CalendarPage            = S("Calendar");
const WaitlistPage            = S("Waitlist");
const LoyaltyPage             = S("Loyalty Program");
const StaffSchedulesPage      = S("Staff Schedules");
const StaffPerformancePage    = S("Staff Performance");
const LaundryPage             = S("Laundry");
const ReportsPage             = S("Reports");
const IntegrationsPage        = S("Integrations");
const AccountSettingsPage     = S("Account Settings");
const SocialMediaPage         = S("Social Media");
const ProviderMapPage         = S("Provider Map");
const ActiveJobsPage          = S("Active Jobs");
const OpsEmergencyPage        = S("Emergency Coordination");
const IncidentReportsPage     = S("Incident Reports");
const SystemAlertsPage        = S("System Alerts");
const ProviderPerformancePage = S("Provider Performance");
const DeliveryDispatchPage    = S("Delivery Dispatch");
const DeliveryAgentsPage      = S("Delivery Agents");
const DeliveryZonesPage       = S("Delivery Zones");
const SystemHealthPage        = S("System Health");
const MarketplaceAdminPage    = S("Marketplace");
const FraudMonitoringPage     = S("Fraud Monitoring");
const SecurityLogsPage        = S("Security Logs");
const ContentModerationPage   = S("Content Moderation");
const KoraAdminSettingsPage   = S("Platform Settings");
// Client sub-routes
const ClientBookingsPage      = S("My Bookings");
const ClientNotificationsPage = S("Notifications");
const ClientServicesPage      = S("Browse Services");
const ClientWellnessPage      = S("Wellness");
const ClientClinicalPage      = S("Clinical Services");
const ClientEmergencyPage     = S("Emergency");
const ClientProfilePage       = S("My Profile");
const ClientLoyaltyPage       = S("Loyalty Points");
const ClientPaymentsPage      = S("Payment Methods");
const ClientSettingsPage      = S("Settings");
// Staff sub-routes
const StaffCheckinPage        = S("Check-in / Out");
const StaffCustomersPage      = S("Customer Profiles");
const StaffNotesPage          = S("Service Notes");
const StaffNavigationPage     = S("GPS Navigation");
const StaffEmergencyPage      = S("Emergency Dispatch");
const StaffMessagesPage       = S("Messages");
const StaffAvailabilityPage   = S("My Availability");
const StaffProfilePage        = S("My Profile");

// ── Real pages ────────────────────────────────────────────────────────────────
const PlanningCenter = lazy(() => import("./components/PlanningCenter"));
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const LandingPage = lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage").then(m => ({ default: m.SearchResultsPage })));
const BookingConfirmationPage = lazy(() => import("./pages/audience/BookingConfirmationPage").then(m => ({ default: m.BookingConfirmationPage })));
const BookingFlowPage = lazy(() => import("./pages/audience/BookingFlowPage").then(m => ({ default: m.BookingFlowPage })));
const BookingsCommandCenter = lazy(() => import("./pages/audience/BookingsCommandCenter").then(m => ({ default: m.BookingsCommandCenter })));
const BusinessAdminDashboardPage = lazy(() => import("./pages/audience/BusinessAdminDashboardPage").then(m => ({ default: m.BusinessAdminDashboardPage })));
const ClientWorkspacePage = lazy(() => import("./pages/audience/ClientWorkspacePage").then(m => ({ default: m.ClientWorkspacePage })));
const KoraAdminSupportPage = lazy(() => import("./pages/audience/KoraAdminSupportPage").then(m => ({ default: m.default })));
const OperationsCommandCenterPage = lazy(() => import("./pages/audience/OperationsCommandCenterPage").then(m => ({ default: m.OperationsCommandCenterPage })));
const StaffWorkspacePage = lazy(() => import("./pages/audience/StaffWorkspacePage").then(m => ({ default: m.StaffWorkspacePage })));
const VenueDetailPage = lazy(() => import("./pages/audience/VenueDetailPage").then(m => ({ default: m.VenueDetailPage })));
const MediaGalleryPage = lazy(() => import("./pages/media/MediaGalleryPage").then(m => ({ default: m.MediaGalleryPage })));
const AutomationBuilder = lazy(() => import("./pages/automation/AutomationBuilder"));
const DispatchDashboard = lazy(() => import("./pages/gps/DispatchDashboard"));
const BusinessReviewsPage = lazy(() => import("./pages/reviews/BusinessReviewsPage").then(m => ({ default: m.BusinessReviewsPage })));
const MarketplaceIntelligencePage = lazy(() => import("./pages/marketplace/MarketplaceIntelligencePage").then(m => ({ default: m.MarketplaceIntelligencePage })));
const MarketplaceInsightsPage = lazy(() => import("./pages/ai/MarketplaceInsightsPage").then(m => ({ default: m.MarketplaceInsightsPage })));
const VideoSessionPage = lazy(() => import("./pages/video/VideoSessionPage").then(m => ({ default: m.VideoSessionPage })));
const DynamicClientsPage = lazy(() => import("./pages/clients/DynamicClientsPage").then(m => ({ default: m.DynamicClientsPage })));
const DynamicBookingsPage = lazy(() => import("./pages/bookings/DynamicBookingsPage").then(m => ({ default: m.DynamicBookingsPage })));
const DynamicServicesPage = lazy(() => import("./pages/services/DynamicServicesPage").then(m => ({ default: m.DynamicServicesPage })));
const DynamicStaffPage = lazy(() => import("./pages/staff/DynamicStaffPage").then(m => ({ default: m.DynamicStaffPage })));
const DynamicCategoriesPage = lazy(() => import("./pages/categories/DynamicCategoriesPage").then(m => ({ default: m.DynamicCategoriesPage })));
const DynamicLoyaltyProgramsPage = lazy(() => import("./pages/dynamic/NewEntityPages").then(m => ({ default: m.DynamicLoyaltyProgramsPage })));
const DynamicInventoryItemsPage = lazy(() => import("./pages/dynamic/NewEntityPages").then(m => ({ default: m.DynamicInventoryItemsPage })));
const DynamicClinicalRecordsPage = lazy(() => import("./pages/dynamic/NewEntityPages").then(m => ({ default: m.DynamicClinicalRecordsPage })));
const DynamicInvoicesPage = lazy(() => import("./pages/dynamic/NewEntityPages").then(m => ({ default: m.DynamicInvoicesPage })));
const DynamicMarketingCampaignsPage = lazy(() => import("./pages/dynamic/NewEntityPages").then(m => ({ default: m.DynamicMarketingCampaignsPage })));
const InventoryItemsPage = lazy(() => import("./pages/inventory/InventoryItemsPage"));
const LeadsPage = lazy(() => import("./pages/crm/LeadsPage"));
const DeliveryBookingsPage = lazy(() => import("./pages/delivery/DeliveryBookingsPage"));
const SocialConnectionsPage = lazy(() => import("./pages/social/SocialConnectionsPage").then(m => ({ default: m.SocialConnectionsPage })));
const CreateBookingPage = lazy(() => import("./pages/bookings/CreateBookingPage").then(m => ({ default: m.CreateBookingPage })));
const EditBookingPage = lazy(() => import("./pages/bookings/EditBookingPage").then(m => ({ default: m.EditBookingPage })));
const CreateClientPage = lazy(() => import("./pages/clients/CreateClientPage").then(m => ({ default: m.CreateClientPage })));
const EditClientPage = lazy(() => import("./pages/clients/EditClientPage").then(m => ({ default: m.EditClientPage })));
const CreateServicePage = lazy(() => import("./pages/services/CreateServicePage").then(m => ({ default: m.CreateServicePage })));
const EditServicePage = lazy(() => import("./pages/services/EditServicePage").then(m => ({ default: m.EditServicePage })));
const CreateStaffPage = lazy(() => import("./pages/staff/CreateStaffPage").then(m => ({ default: m.CreateStaffPage })));
const AvailabilitySettingsPage = lazy(() => import("./pages/availability/AvailabilitySettingsPage").then(m => ({ default: m.AvailabilitySettingsPage })));
const CategoryManagementPage = lazy(() => import("./pages/categories/CategoryManagementPage").then(m => ({ default: m.CategoryManagementPage })));
const SocialPostComposer = lazy(() => import("./pages/social/SocialPostComposer").then(m => ({ default: m.SocialPostComposer })));
const CampaignsListPage = lazy(() => import("./pages/marketing/CampaignsListPage"));
const TicketsListPage = lazy(() => import("./pages/support/TicketsListPage"));
const SupportDetailPage = lazy(() => import("./pages/support/DetailPage"));
const FeatureFlagsPage = lazy(() => import("./pages/platform-admin/FeatureFlagsPage"));
const PlatformUsersPage = lazy(() => import("./pages/platform-admin/UsersPage"));
const PlatformRevenuePage = lazy(() => import("./pages/platform-admin/RevenuePage"));
const AIUsagePage = lazy(() => import("./pages/platform-admin/AIUsagePage"));
const ClientsListPage = lazy(() => import("./pages/clients/ListPageEnhanced"));
const BookingsListPage = lazy(() => import("./pages/bookings/ListPageEnhanced"));
const ServicesListPage = lazy(() => import("./pages/services/ListPageEnhanced"));
const StaffListPage = lazy(() => import("./pages/staff/ListPageEnhanced"));
const LocationsListPage = lazy(() => import("./pages/locations/ListPage"));
const PaymentsListPage = lazy(() => import("./pages/payments/ListPage"));
const TenantsListPage = lazy(() => import("./pages/tenants/ListPage"));
const TenantsCreatePage = lazy(() => import("./pages/tenants/CreatePage"));
const TenantsDetailPage = lazy(() => import("./pages/tenants/DetailPage"));
const TenantsEditPage = lazy(() => import("./pages/tenants/EditPage"));
const SubscriptionsListPage = lazy(() => import("./pages/subscriptions/ListPage"));
const SubscriptionsCreatePage = lazy(() => import("./pages/subscriptions/CreatePage"));
const SubscriptionsEditPage = lazy(() => import("./pages/subscriptions/EditPage"));
const ClientsCreatePage = lazy(() => import("./pages/clients/CreatePageEnhanced"));
const BookingsCreatePage = lazy(() => import("./pages/bookings/CreatePage"));
const ServicesCreatePage = lazy(() => import("./pages/services/CreatePage"));
const StaffCreatePage = lazy(() => import("./pages/staff/CreatePage"));
const ClientsEditPage = lazy(() => import("./pages/clients/EditPageEnhanced"));
const BookingsEditPage = lazy(() => import("./pages/bookings/EditPage"));
const ServicesEditPage = lazy(() => import("./pages/services/EditPage"));
const StaffEditPage = lazy(() => import("./pages/staff/EditPage"));
const ClientsDetailPage = lazy(() => import("./pages/clients/DetailPage"));
const BookingsDetailPage = lazy(() => import("./pages/bookings/DetailPage"));
const ServicesDetailPage = lazy(() => import("./pages/services/DetailPage"));
const StaffDetailPage = lazy(() => import("./pages/staff/DetailPage"));
const MySchedulePage = lazy(() => import("./pages/staff/MySchedule"));
const TodayJobsPage = lazy(() => import("./pages/staff/TodayJobs"));
const SettingsPageLazy = lazy(() => import("./pages/SettingsPage"));

const F = <div style={{ padding: 16, color: "var(--color-text-muted)" }}>Loading...</div>;

const clinicalRoles = ["business_admin","platform_admin","staff","doctor","nurse","pharmacist","lab_scientist","caregiver"] as const;
const emergencyRoles = ["business_admin","platform_admin","operations","staff","dispatcher","client"] as const;
const deliveryRoles = ["business_admin","platform_admin","operations","dispatcher","delivery_agent"] as const;
const contentRoles = ["business_admin","platform_admin","staff"] as const;

const ba = ["business_admin"] as const;
const pa = ["platform_admin"] as const;
const ops = ["operations"] as const;

function G({ roles, children }: { roles: readonly string[]; children: React.ReactNode }) {
  return (
    <DashboardRouteGuard allowedRoles={roles as any}>
      <Suspense fallback={F}>{children}</Suspense>
    </DashboardRouteGuard>
  );
}

export default function App() {
  useQueryErrorHandler();

  return (
    <>
      <CommandPalette />
      <Suspense fallback={F}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/app" element={<AppShell><Outlet /></AppShell>}>
            <Route index element={<DefaultDashboardRedirect />} />

            {/* ── Shared ── */}
            <Route path="bookings" element={<BookingsCommandCenter />} />
            <Route path="clinical" element={<G roles={clinicalRoles}><ClinicalModule /></G>} />
            <Route path="clinical/patients" element={<G roles={clinicalRoles}><ClinicalModule /></G>} />
            <Route path="clinical/appointments" element={<G roles={clinicalRoles}><ClinicalModule /></G>} />
            <Route path="clinical/notes" element={<G roles={clinicalRoles}><ClinicalModule /></G>} />
            <Route path="clinical/prescriptions" element={<G roles={clinicalRoles}><ClinicalModule /></G>} />
            <Route path="clinical/lab" element={<G roles={clinicalRoles}><ClinicalModule /></G>} />
            <Route path="clinical/pharmacy" element={<G roles={clinicalRoles}><ClinicalModule /></G>} />
            <Route path="clinical/followups" element={<G roles={clinicalRoles}><ClinicalModule /></G>} />
            <Route path="emergency" element={<G roles={emergencyRoles}><EmergencyModule /></G>} />
            <Route path="emergency/new" element={<G roles={emergencyRoles}><EmergencyModule /></G>} />
            <Route path="emergency/active" element={<G roles={emergencyRoles}><EmergencyModule /></G>} />
            <Route path="emergency/units" element={<G roles={emergencyRoles}><EmergencyModule /></G>} />
            <Route path="emergency/resolved" element={<G roles={emergencyRoles}><EmergencyModule /></G>} />
            <Route path="emergency/reports" element={<G roles={emergencyRoles}><EmergencyModule /></G>} />
            <Route path="delivery" element={<G roles={deliveryRoles}><DeliveryModule /></G>} />
            <Route path="delivery/bookings" element={<G roles={deliveryRoles}><DeliveryModule /></G>} />
            <Route path="delivery/agents" element={<G roles={deliveryRoles}><DeliveryModule /></G>} />
            <Route path="delivery/tracking" element={<G roles={deliveryRoles}><DeliveryModule /></G>} />
            <Route path="delivery/completed" element={<G roles={deliveryRoles}><DeliveryModule /></G>} />
            <Route path="content" element={<G roles={contentRoles}><ContentModule /></G>} />
            <Route path="content/new" element={<G roles={contentRoles}><ContentModule /></G>} />
            <Route path="finance" element={<G roles={["business_admin","platform_admin"]}><FinanceCenter /></G>} />
            <Route path="insights" element={<AIInsightsDashboard />} />
            <Route path="planning" element={<PlanningCenter />} />
            <Route path="reports" element={<ReportsCenter />} />
            <Route path="overview" element={<Dashboard />} />
            <Route path="forbidden" element={<ForbiddenPage />} />
            <Route path="venues/:slug" element={<VenueDetailPage />} />
            <Route path="booking/confirmed/:bookingId" element={<BookingConfirmationPage />} />

            {/* ── Client ── */}
            <Route path="client" element={<G roles={["client"]}><ClientWorkspacePage /></G>} />
            <Route path="client/book" element={<BookingFlowPage />} />
            <Route path="client/bookings" element={<G roles={["client"]}><ClientBookingsPage /></G>} />
            <Route path="client/notifications" element={<G roles={["client"]}><ClientNotificationsPage /></G>} />
            <Route path="client/services" element={<G roles={["client"]}><ClientServicesPage /></G>} />
            <Route path="client/services/wellness" element={<G roles={["client"]}><ClientWellnessPage /></G>} />
            <Route path="client/services/clinical" element={<G roles={["client"]}><ClientClinicalPage /></G>} />
            <Route path="client/emergency" element={<G roles={["client"]}><ClientEmergencyPage /></G>} />
            <Route path="client/profile" element={<G roles={["client"]}><ClientProfilePage /></G>} />
            <Route path="client/loyalty" element={<G roles={["client"]}><ClientLoyaltyPage /></G>} />
            <Route path="client/payments" element={<G roles={["client"]}><ClientPaymentsPage /></G>} />
            <Route path="client/settings" element={<G roles={["client"]}><ClientSettingsPage /></G>} />

            {/* ── Staff ── */}
            <Route path="staff" element={<G roles={["staff"]}><StaffWorkspacePage /></G>} />
            <Route path="staff/schedule" element={<G roles={["staff"]}><MySchedulePage /></G>} />
            <Route path="staff/jobs" element={<G roles={["staff"]}><TodayJobsPage /></G>} />
            <Route path="staff/checkin" element={<G roles={["staff"]}><StaffCheckinPage /></G>} />
            <Route path="staff/customers" element={<G roles={["staff"]}><StaffCustomersPage /></G>} />
            <Route path="staff/notes" element={<G roles={["staff"]}><StaffNotesPage /></G>} />
            <Route path="staff/navigation" element={<G roles={["staff"]}><StaffNavigationPage /></G>} />
            <Route path="staff/emergency" element={<G roles={["staff"]}><StaffEmergencyPage /></G>} />
            <Route path="staff/messages" element={<G roles={["staff"]}><StaffMessagesPage /></G>} />
            <Route path="staff/availability" element={<G roles={["staff"]}><StaffAvailabilityPage /></G>} />
            <Route path="staff/profile" element={<G roles={["staff"]}><StaffProfilePage /></G>} />
            <Route path="staff/create" element={<G roles={ba}><CreateStaffPage /></G>} />
            <Route path="staff/:id/availability" element={<G roles={ba}><AvailabilitySettingsPage /></G>} />

            {/* ── Business Admin ── */}
            <Route path="business-admin" element={<G roles={ba}><BusinessAdminDashboardPage /></G>} />
            <Route path="business-admin/ai-insights" element={<G roles={ba}><MarketplaceInsightsPage /></G>} />
            <Route path="business-admin/calendar" element={<G roles={ba}><CalendarPage /></G>} />
            <Route path="business-admin/waitlist" element={<G roles={ba}><WaitlistPage /></G>} />
            <Route path="business-admin/bookings" element={<G roles={ba}><BookingsListPage /></G>} />
            <Route path="business-admin/bookings/create" element={<G roles={ba}><BookingsCreatePage /></G>} />
            <Route path="business-admin/bookings/:id" element={<G roles={ba}><BookingsDetailPage /></G>} />
            <Route path="business-admin/bookings/:id/edit" element={<G roles={ba}><BookingsEditPage /></G>} />
            <Route path="business-admin/crm" element={<G roles={["sales_manager","sales_agent","business_admin","platform_admin"]}><LeadsPage /></G>} />
            <Route path="business-admin/leads" element={<G roles={["sales_manager","sales_agent","business_admin","platform_admin"]}><LeadsPage /></G>} />
            <Route path="business-admin/loyalty" element={<G roles={ba}><LoyaltyPage /></G>} />
            <Route path="business-admin/loyalty-programs" element={<G roles={ba}><DynamicLoyaltyProgramsPage /></G>} />
            <Route path="business-admin/reviews" element={<G roles={ba}><BusinessReviewsPage /></G>} />
            <Route path="business-admin/clients" element={<G roles={ba}><ClientsListPage /></G>} />
            <Route path="business-admin/clients/create" element={<G roles={ba}><ClientsCreatePage /></G>} />
            <Route path="business-admin/clients/:id" element={<G roles={ba}><ClientsDetailPage /></G>} />
            <Route path="business-admin/clients/:id/edit" element={<G roles={ba}><ClientsEditPage /></G>} />
            <Route path="business-admin/staff" element={<G roles={ba}><StaffListPage /></G>} />
            <Route path="business-admin/staff/schedules" element={<G roles={ba}><StaffSchedulesPage /></G>} />
            <Route path="business-admin/staff/performance" element={<G roles={ba}><StaffPerformancePage /></G>} />
            <Route path="business-admin/staff/create" element={<G roles={ba}><StaffCreatePage /></G>} />
            <Route path="business-admin/staff/:id" element={<G roles={ba}><StaffDetailPage /></G>} />
            <Route path="business-admin/staff/:id/edit" element={<G roles={ba}><StaffEditPage /></G>} />
            <Route path="business-admin/services" element={<G roles={ba}><ServicesListPage /></G>} />
            <Route path="business-admin/services/create" element={<G roles={ba}><ServicesCreatePage /></G>} />
            <Route path="business-admin/services/:id" element={<G roles={ba}><ServicesDetailPage /></G>} />
            <Route path="business-admin/services/:id/edit" element={<G roles={ba}><ServicesEditPage /></G>} />
            <Route path="business-admin/inventory" element={<G roles={["inventory_manager","business_admin","platform_admin"]}><InventoryItemsPage /></G>} />
            <Route path="business-admin/inventory-items" element={<G roles={ba}><DynamicInventoryItemsPage /></G>} />
            <Route path="business-admin/laundry" element={<G roles={ba}><LaundryPage /></G>} />
            <Route path="business-admin/payments" element={<G roles={ba}><PaymentsListPage /></G>} />
            <Route path="business-admin/invoices" element={<G roles={ba}><DynamicInvoicesPage /></G>} />
            <Route path="business-admin/reports" element={<G roles={ba}><ReportsPage /></G>} />
            <Route path="business-admin/marketing" element={<G roles={ba}><CampaignsListPage /></G>} />
            <Route path="business-admin/marketing-campaigns" element={<G roles={ba}><DynamicMarketingCampaignsPage /></G>} />
            <Route path="business-admin/social" element={<G roles={ba}><SocialMediaPage /></G>} />
            <Route path="business-admin/social-connections" element={<G roles={ba}><SocialConnectionsPage /></G>} />
            <Route path="business-admin/media" element={<G roles={ba}><MediaGalleryPage /></G>} />
            <Route path="business-admin/integrations" element={<G roles={ba}><IntegrationsPage /></G>} />
            <Route path="business-admin/locations" element={<G roles={ba}><LocationsListPage /></G>} />
            <Route path="business-admin/settings" element={<G roles={ba}><AccountSettingsPage /></G>} />
            <Route path="business-admin/automation" element={<G roles={ba}><AutomationBuilder /></G>} />
            <Route path="business-admin/marketplace" element={<G roles={ba}><MarketplaceIntelligencePage /></G>} />
            <Route path="business-admin/video-sessions" element={<G roles={ba}><VideoSessionPage /></G>} />
            <Route path="business-admin/clients-dynamic" element={<G roles={ba}><DynamicClientsPage /></G>} />
            <Route path="business-admin/bookings-dynamic" element={<G roles={ba}><DynamicBookingsPage /></G>} />
            <Route path="business-admin/services-dynamic" element={<G roles={ba}><DynamicServicesPage /></G>} />
            <Route path="business-admin/staff-dynamic" element={<G roles={ba}><DynamicStaffPage /></G>} />
            <Route path="business-admin/categories-dynamic" element={<G roles={ba}><DynamicCategoriesPage /></G>} />
            <Route path="business-admin/clinical-records" element={<G roles={ba}><DynamicClinicalRecordsPage /></G>} />
            <Route path="business-admin/categories" element={<G roles={ba}><CategoryManagementPage /></G>} />

            {/* ── Operations ── */}
            <Route path="operations" element={<G roles={ops}><OperationsCommandCenterPage /></G>} />
            <Route path="operations/dispatch-dashboard" element={<G roles={ops}><DispatchDashboard /></G>} />
            <Route path="operations/map" element={<G roles={ops}><ProviderMapPage /></G>} />
            <Route path="operations/jobs" element={<G roles={ops}><ActiveJobsPage /></G>} />
            <Route path="operations/emergency" element={<G roles={["business_admin","platform_admin","operations","staff"]}><OpsEmergencyPage /></G>} />
            <Route path="operations/incidents" element={<G roles={ops}><IncidentReportsPage /></G>} />
            <Route path="operations/alerts" element={<G roles={ops}><SystemAlertsPage /></G>} />
            <Route path="operations/support" element={<G roles={ops}><TicketsListPage /></G>} />
            <Route path="operations/support/:id" element={<G roles={ops}><SupportDetailPage /></G>} />
            <Route path="operations/performance" element={<G roles={ops}><ProviderPerformancePage /></G>} />
            <Route path="operations/delivery/bookings" element={<G roles={["dispatcher","operations","business_admin","platform_admin"]}><DeliveryBookingsPage /></G>} />
            <Route path="operations/delivery/dispatch" element={<G roles={["dispatcher","operations"]}><DeliveryDispatchPage /></G>} />
            <Route path="operations/delivery/agents" element={<G roles={["dispatcher","operations"]}><DeliveryAgentsPage /></G>} />
            <Route path="operations/delivery/zones" element={<G roles={["dispatcher","operations"]}><DeliveryZonesPage /></G>} />

            {/* ── Kora Admin ── */}
            <Route path="kora-admin" element={<G roles={pa}><Navigate to="/app/kora-admin/tenants" replace /></G>} />
            <Route path="kora-admin/health" element={<G roles={pa}><SystemHealthPage /></G>} />
            <Route path="kora-admin/ai-usage" element={<G roles={pa}><AIUsagePage /></G>} />
            <Route path="kora-admin/features" element={<G roles={pa}><FeatureFlagsPage /></G>} />
            <Route path="kora-admin/tenants" element={<G roles={pa}><TenantsListPage /></G>} />
            <Route path="kora-admin/tenants/create" element={<G roles={pa}><TenantsCreatePage /></G>} />
            <Route path="kora-admin/tenants/:id" element={<G roles={pa}><TenantsDetailPage /></G>} />
            <Route path="kora-admin/tenants/:id/edit" element={<G roles={pa}><TenantsEditPage /></G>} />
            <Route path="kora-admin/revenue" element={<G roles={pa}><PlatformRevenuePage /></G>} />
            <Route path="kora-admin/subscriptions" element={<G roles={pa}><SubscriptionsListPage /></G>} />
            <Route path="kora-admin/subscriptions/create" element={<G roles={pa}><SubscriptionsCreatePage /></G>} />
            <Route path="kora-admin/subscriptions/:id/edit" element={<G roles={pa}><SubscriptionsEditPage /></G>} />
            <Route path="kora-admin/marketplace" element={<G roles={pa}><MarketplaceAdminPage /></G>} />
            <Route path="kora-admin/fraud" element={<G roles={pa}><FraudMonitoringPage /></G>} />
            <Route path="kora-admin/security" element={<G roles={pa}><SecurityLogsPage /></G>} />
            <Route path="kora-admin/moderation" element={<G roles={pa}><ContentModerationPage /></G>} />
            <Route path="kora-admin/users" element={<G roles={pa}><PlatformUsersPage /></G>} />
            <Route path="kora-admin/support" element={<G roles={pa}><KoraAdminSupportPage /></G>} />
            <Route path="kora-admin/support/:id" element={<G roles={pa}><SupportDetailPage /></G>} />
            <Route path="kora-admin/support/queue" element={<G roles={pa}><Navigate to="/app/kora-admin/support?view=queue" replace /></G>} />
            <Route path="kora-admin/support/escalations" element={<G roles={pa}><Navigate to="/app/kora-admin/support?view=escalations" replace /></G>} />
            <Route path="kora-admin/support/resolved" element={<G roles={pa}><Navigate to="/app/kora-admin/support?view=resolved" replace /></G>} />
            <Route path="kora-admin/settings" element={<G roles={pa}><KoraAdminSettingsPage /></G>} />

            {/* ── Legacy CRUD ── */}
            <Route path="bookings/create" element={<CreateBookingPage />} />
            <Route path="bookings/:id/edit" element={<EditBookingPage />} />
            <Route path="clients/create" element={<CreateClientPage />} />
            <Route path="clients/:id/edit" element={<EditClientPage />} />
            <Route path="services/create" element={<CreateServicePage />} />
            <Route path="services/:id/edit" element={<EditServicePage />} />
            <Route path="services/categories" element={<CategoryManagementPage />} />
            <Route path="social/compose" element={<SocialPostComposer />} />
            <Route path="settings" element={<G roles={["business_admin","platform_admin","operations","staff","doctor","nurse","pharmacist","lab_scientist","caregiver","dispatcher","delivery_agent","inventory_manager","sales_manager","sales_agent"]}><Suspense fallback={F}><SettingsPageLazy /></Suspense></G>} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
