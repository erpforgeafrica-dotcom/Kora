# KORA Frontend Reconstruction Plan
## Enterprise Operating System Interface Recovery

**Status**: Comprehensive Architecture & Implementation Plan  
**Date**: March 21, 2026  
**Scope**: Full frontend rebuild from placeholder shell to operational system

---

## 1. FINAL FRONTEND ARCHITECTURE

### Domain Structure
```
📦 Frontend Architecture (Hierarchical)
├─ 🔐 PUBLIC DOMAIN
│  ├─ /login          [LoginPage] - JWT auth entry
│  ├─ /                [LandingPage] - Marketing/public info
│  └─ /search          [SearchResultsPage] - Public discovery (if relevant)
│
├─ 👤 USER DOMAIN (Requires Auth + Role)
│  ├─ /app/client                [ClientWorkspacePage] - Client-only dashboard
│  ├─ /app/staff                 [StaffWorkspacePage] - Staff-only workspace
│  └─ /app/business-admin        [BusinessAdminDashboardPage] - Business admin portal
│
├─ 🏢 OPERATIONS DOMAIN (ops + kora_admin roles)
│  ├─ /app/operations            [OperationsCommandCenterPage] - Live ops dashboard
│  └─ /app/operations/dispatch-dashboard [DispatchDashboard] - GPS/delivery dispatch
│
├─ 🛠️ ADMIN DOMAIN (platform_admin only)
│  ├─ /app/platform-admin          [KoraAdminDashboardPage] - Platform control center
│  ├─ /app/platform-admin/health   [SystemHealthPage] - System monitoring
│  ├─ /app/platform-admin/ai-usage [AIUsagePage] - AI analytics
│  ├─ /app/platform-admin/features [FeatureFlagsPage] - Feature toggles
│  ├─ /app/platform-admin/tenants  [TenantsListPage] - Tenant management
│  ├─ /app/platform-admin/users    [PlatformUsersPage] - User administration
│  └─ /app/platform-admin/support  [SupportToolsPage] - Support operations
│
├─ 💳 MONETIZATION DOMAIN
│  ├─ /dashboard/ai              [AIDashboardPage] - AI usage & billing (business_admin)
│  └─ /billing                   [BillingPage] - Subscription management
│
└─ ⚙️ CORE MODULES (business-user domain)
   ├─ Bookings    [/app/business-admin/bookings]
   ├─ Clients     [/app/business-admin/crm or clients]
   ├─ Services    [/app/business-admin/services]
   ├─ Staff       [/app/business-admin/staff]
   ├─ Inventory   [/app/business-admin/inventory]
   ├─ Reports     [/app/business-admin/reports]
   └─ Settings    [/app/business-admin/settings]
```

### Permission Model
```
Roles & Visibility:
├─ client
│  └─ /app/client/*, limited read-only operations
├─ staff
│  └─ /app/staff/*, read & update own work
├─ business_admin
│  └─ /app/business-admin/*, full business operations + /dashboard/ai + /billing
├─ operations
│  └─ /app/operations/*, dispatch & delivery management
├─ platform_admin
│  └─ /app/platform-admin/*, full platform control + /app (all admins)
└─ OTHER ROLES
   └─ Specialist roles (inventory_manager, sales_manager, etc.) map to business_admin subset
```

---

## 2. FINAL NAVIGATION MAP

### Client Navigation
```yaml
Dashboard:
  - path: /app/client
    label: "Overview"
    icon: "home"
    role: ["client"]

Services:
  - path: /app/client/services
    label: "Browse Services"
    icon: "grid"
  - path: /app/client/bookings
    label: "My Bookings"
    icon: "calendar"

Account:
  - path: /app/client/profile
    label: "Profile"
    icon: "user"
  - path: /app/client/settings
    label: "Settings"
    icon: "settings"
```

### Staff Navigation
```yaml
My Work:
  - path: /app/staff/schedule
    label: "My Schedule"
    icon: "calendar"
  - path: /app/staff/jobs
    label: "Today's Jobs"
    icon: "clock"

Customers:
  - path: /app/staff/customers
    label: "Customer Profiles"
    icon: "users"

Lookup:
  - path: /app/staff/navigation
    label: "GPS Navigation"
    icon: "map"
```

### Business Admin Navigation
```yaml
Dashboard:
  - path: /app/business-admin
    label: "Overview"
    icon: "home"
  - path: /dashboard/ai
    label: "AI Dashboard"
    icon: "sparkles"
  - path: /billing
    label: "Billing Plan"
    icon: "credit-card"

Operations:
  - path: /app/business-admin/bookings
    label: "Bookings"
    icon: "calendar"
  - path: /app/business-admin/calendar
    label: "Calendar"
    icon: "calendar"

Customers:
  - path: /app/business-admin/crm
    label: "CRM"
    icon: "users"
  - path: /app/business-admin/leads
    label: "Leads"
    icon: "person-plus"

Team:
  - path: /app/business-admin/staff
    label: "Staff"
    icon: "briefcase"

Services:
  - path: /app/business-admin/services
    label: "Services"
    icon: "tag"
  - path: /app/business-admin/inventory
    label: "Inventory"
    icon: "box"

Finance:
  - path: /app/business-admin/payments
    label: "Payments"
    icon: "dollar"
  - path: /app/business-admin/reports
    label: "Reports"
    icon: "chart-bar"

Settings:
  - path: /app/business-admin/settings
    label: "Settings"
    icon: "settings"
```

### Operations Navigation
```yaml
Live Operations:
  - path: /app/operations
    label: "Live Feed"
    icon: "activity"
  - path: /app/operations/dispatch-dashboard
    label: "Dispatch Board"
    icon: "map"

Delivery:
  - path: /app/operations/delivery/bookings
    label: "Delivery Bookings"
    icon: "truck"
  - path: /app/operations/delivery/dispatch
    label: "Dispatch"
    icon: "navigation"
```

### Platform Admin Navigation
```yaml
Platform:
  - path: /app/platform-admin
    label: "Platform Overview"
    icon: "globe"
  - path: /app/platform-admin/health
    label: "System Health"
    icon: "activity"
  - path: /app/platform-admin/ai-usage
    label: "AI Usage"
    icon: "sparkles"
  - path: /app/platform-admin/features
    label: "Feature Flags"
    icon: "toggle"

Tenants:
  - path: /app/platform-admin/tenants
    label: "Tenant Management"
    icon: "building"
  - path: /app/platform-admin/subscriptions
    label: "Subscriptions"
    icon: "credit-card"
  - path: /app/platform-admin/revenue
    label: "Revenue"
    icon: "chart-line"

Admin:
  - path: /app/platform-admin/users
    label: "User Management"
    icon: "users"
  - path: /app/platform-admin/support
    label: "Support Tools"
    icon: "headset"
  - path: /app/platform-admin/settings
    label: "Settings"
    icon: "settings"
```

---

## 3. ROUTE-BY-ROUTE RECOVERY PLAN

### Public Routes
| Path | Current | Action | Backend Endpoint | Purpose |
|------|---------|--------|------------------|---------|
| `/login` | LoginPage works | **KEEP** | POST /api/auth/login | User authentication |
| `/` | LandingPage | **KEEP** | None (static) | Marketing landing |
| `/search` | SearchResultsPage | **REMOVE** | N/A | Not implemented in backend |

### Client Routes (Auto-redirect from /app based on role)
| Path | Current | Action | Backend | Purpose |
|------|---------|--------|---------|---------|
| `/app/client` | ClientWorkspacePage | **KEEP** | GET /api/bookings (client context) | Client dashboard |
| `/app/client/bookings` | Not explicit | **CREATE** | GET /api/bookings?client=true | Upcoming bookings |
| `/app/client/profile` | Not explicit | **CREATE** | GET /api/auth/me | Client profile view |
| `/app/client/services` | Not explicit | **CREATE** | GET /api/services | Browse services |

### Staff Routes
| Path | Current | Action | Backend | Purpose |
|------|---------|--------|---------|---------|
| `/app/staff` | StaffWorkspacePage | **KEEP** | GET /api/staff/me, GET /api/bookings?staff=true | Staff dashboard |
| `/app/staff/schedule` | Not explicit | **CREATE** | GET /api/availability/:staff_id | Staff availability |
| `/app/staff/jobs` | Not explicit | **CREATE** | GET /api/bookings?staff=true&date=today | Today's bookings |
| `/app/staff/customers` | Not explicit | **CREATE** | GET /api/clients (staff-scoped) | Customer profiles |

### Business Admin Routes
| Path | Current | Action | Backend | Purpose |
|------|---------|--------|---------|---------|
| `/app/business-admin` | BusinessAdminDashboardPage | **KEEP** | GET /api/dashboard/business (aggregates data) | Business KPI dashboard |
| `/app/business-admin/bookings` | DynamicBookingsPage exists | **KEEP** | GET /api/bookings | Bookings list |
| `/app/business-admin/bookings/:id` | BookingsDetailPage exists | **KEEP** | GET /api/bookings/:id | Booking detail |
| `/app/business-admin/bookings/create` | CreateBookingPage exists | **KEEP** | POST /api/bookings | Create booking |
| `/app/business-admin/bookings/:id/edit` | EditBookingPage exists | **KEEP** | PATCH /api/bookings/:id | Edit booking |
| `/app/business-admin/crm` | Not explicit | **CREATE** | GET /api/clients (or /api/crm/leads) | CRM/Clients list |
| `/app/business-admin/leads` | LeadsPage exists | **KEEP** | GET /api/crm/leads | CRM leads |
| `/app/business-admin/services` | DynamicServicesPage exists | **KEEP** | GET /api/services | Services catalog |
| `/app/business-admin/services/:id` | ServicesDetailPage exists | **KEEP** | GET /api/services/:id | Service detail |
| `/app/business-admin/services/create` | CreateServicePage exists | **KEEP** | POST /api/services | Create service |
| `/app/business-admin/staff` | DynamicStaffPage exists | **KEEP** | GET /api/staff | Staff list |
| `/app/business-admin/staff/:id` | StaffDetailPage exists | **KEEP** | GET /api/staff/:id | Staff detail |
| `/app/business-admin/staff/create` | CreateStaffPage exists | **KEEP** | POST /api/staff | Create staff |
| `/app/business-admin/inventory` | InventoryItemsPage exists | **KEEP** | GET /api/inventory | Inventory list |
| `/app/business-admin/payments` | PaymentsListPage exists | **KEEP** | GET /api/payments | Payments/revenue |
| `/app/business-admin/reports` | ReportsCenter exists | **KEEP** | GET /api/reporting/generate | Reports |
| `/app/business-admin/calendar` | Not explicit | **CREATE or REMOVE** | GET /api/bookings grouped by date | Calendar view (optional) |
| `/app/business-admin/settings` | SettingsPage exists | **KEEP** | GET /api/organizations/:id, PATCH | Settings |
| `/dashboard/ai` | AIDashboardPage exists | **KEEP** | GET /api/ai/metrics/live | AI intelligence dashboard |
| `/billing` | BillingPage exists | **KEEP** | GET /api/subscriptions, POST /api/billing/initialize | Billing management |

### Operations Routes
| Path | Current | Action | Backend | Purpose |
|------|---------|--------|---------|---------|
| `/app/operations` | OperationsCommandCenterPage | **KEEP** | GET /api/bookings, GET /api/delivery/bookings | Live operations center |
| `/app/operations/dispatch-dashboard` | DispatchDashboard exists | **KEEP** | GET /api/delivery/agents, GET /api/delivery/bookings | GPS dispatch |
| `/app/operations/delivery/bookings` | DeliveryBookingsPage exists | **KEEP** | GET /api/delivery/bookings | Delivery list |
| `/app/operations/emergency` | Not explicit | **REMOVE** | N/A | Not implemented |

### Platform Admin Routes
| Path | Current | Action | Backend | Purpose |
|------|---------|--------|---------|---------|
| `/app/platform-admin` | KoraAdminDashboardPage | **KEEP** | GET /api/platform/dashboard (aggregates KPIs) | Platform control center |
| `/app/platform-admin/health` | Not explicit | **CREATE** | GET /health, GET /api/platform/health | System monitoring |
| `/app/platform-admin/ai-usage` | AIUsagePage exists | **KEEP** | GET /api/ai/usage/summary | AI provider usage |
| `/app/platform-admin/features` | FeatureFlagsPage exists | **KEEP** | GET /api/platform/feature-flags, PATCH | Feature toggles |
| `/app/platform-admin/tenants` | TenantsListPage exists | **KEEP** | GET /api/tenants (or /api/organizations) | Tenant admin |
| `/app/platform-admin/tenants/create` | TenantsCreatePage exists | **KEEP** | POST /api/tenants | Create tenant |
| `/app/platform-admin/tenants/:id` | TenantsEditPage exists | **KEEP** | GET /api/tenants/:id, PATCH | Edit tenant |
| `/app/platform-admin/subscriptions` | SubscriptionsListPage exists | **KEEP** | GET /api/subscriptions | Subscriptions |
| `/app/platform-admin/users` | PlatformUsersPage exists | **KEEP** | GET /api/users (platform-wide) | User management |
| `/app/platform-admin/revenue` | PlatformRevenuePage exists | **KEEP** | GET /api/revenue/summary | Revenue reporting |
| `/app/platform-admin/support` | Not explicit | **CREATE** | GET /api/support/tickets | Support queue |
| `/app/platform-admin/settings` | Not explicit | **CREATE** | GET /api/platform/settings, PATCH | Platform settings |

### Routes to REMOVE (Placeholder/Dead)
- `/auth/*` (use `/login` instead)
- `/app/kora-admin/*` (use `/app/platform-admin/*` instead - role alias only)
- Any route ending in `.../notfound` or showing "Route not found"
- `/app/dashboard/*` (consolidate into role-specific dashboards)
- `/app/planning/*` (internal tool, hide from nav)
- `/app/marketplace` (not in Prompt 1 backend scope - REMOVE unless proven)
- `/app/kora-admin/fraud`, `/security`, `/moderation` (not implemented - REMOVE)
- All "Dynamic*Page" routes that are duplicates of CRUD pages - keep only one implementation

### Routes to CREATE (Currently missing)
- `/app/platform-admin/health` - System health monitoring
- `/app/platform-admin/support` - Support ticket operations
- `/app/client/bookings` - Client booking list
- `/app/client/profile` - Client profile editing
- `/app/staff/schedule`, `/jobs`, `/customers` - Staff workflow pages
- `/app/business-admin/crm` - CRM dashboard (alias or new page for leads/clients)

---

## 4. PAGE-BY-PAGE IMPLEMENTATION PLAN

### A. PUBLIC PAGES

#### LoginPage ✅
```
Current State: WORKING (fixed CSRF exemption)
Data Shown: 
  - Email input field (default: test@example.com)
  - Password input field (default: password123)
  - Sign in button
  
API Binding:
  POST /api/auth/login
  {email, password}
  Response: {accessToken, user: {id, email, role, organizationId}}
  
State Handling:
  ✅ loading state (Sign in button shows "Signing in…")
  ✅ error display (shows error message below form)
  ✅ success redirect (navigates to /app or from state)
  
Actions:
  - Submit form to login
  - Redirect on success
  
No Changes Needed - WORKING
```

#### LandingPage (/)
```
Current State: WORKING (public marketing page)
Data Shown:
  - Marketing copy
  - Feature highlights
  - Call-to-action buttons
  
No Backend Calls
Actions:
  - Link to /login
  - Link to /search (optional)
  
No Changes Needed - KEEP
```

### B. CORE DASHBOARD PAGES

#### ClientWorkspacePage (/app/client)
```
Purpose: Client-only dashboard showing upcoming bookings and quick actions

Data to Fetch (on mount):
  GET /api/bookings?client=true
  GET /api/auth/me (for personalization)
  
Data Shown:
  - Welcome message with client name (from /api/auth/me)
  - Upcoming bookings (next 7 days) from /api/bookings
  - Quick links to: Browse Services, My Profile, Settings
  - Empty state if no bookings

State Handling:
  ✅ loading: skeleton or spinner
  ✅ empty: "You don't have any upcoming bookings" + Browse Services button
  ✅ error: error card with retry button
  ✅ success: list of bookings with detail links
  
Actions:
  - Click booking to view /app/client/bookings/:id
  - Browse Services link to /app/client/services
  
Components:
  - PageLayout with title "My Bookings"
  - DataTable or card grid for bookings
  - Error boundary

Backend Requirements:
  - GET /api/bookings must support client context filtering
  - Response: [{id, service_name, start_time, end_time, status, staff_name}]
```

#### StaffWorkspacePage (/app/staff)
```
Purpose: Staff-only dashboard showing today's jobs and schedule

Data to Fetch (on mount):
  GET /api/bookings?staff=true&date=today
  GET /api/availability/:staff_id  (optional - for next shift)
  GET /api/auth/me (current staff member context)
  
Data Shown:
  - Staff name and role
  - "Today's Jobs" list with times, customers, locations
  - "My Schedule" card showing next shift
  - Check-in/out status badge
  - Quick links: My Schedule, Customer Profiles, Navigation

State Handling:
  ✅ loading: skeleton list
  ✅ empty: "No jobs scheduled for today" + next shift info
  ✅ error: error card with retry
  ✅ success: list of jobs grouped by time
  
Actions:
  - Click job to view details
  - Check-in button (if available)
  - Start GPS navigation button
  
Components:
  - PageLayout
  - DataTable for jobs
  - Status badges

Backend Requirements:
  - GET /api/bookings?staff=true&date=today must filter by staff + date
  - GET /api/availability/:staff_id returns {staff_id, shifts: [{start, end, status}]}
```

#### BusinessAdminDashboardPage (/app/business-admin)
```
Purpose: Business admin control center with KPIs and quick actions

Data to Fetch (on mount):
  GET /api/dashboard/business (aggregated business metrics)
  Fallback: Individual endpoints if dashboard endpoint doesn't exist:
    - GET /api/bookings?status=pending (pending count)
    - GET /api/bookings?date=today (today's bookings)
    - GET /api/revenue/summary?period=thisMonth (monthly revenue)
    - GET /api/staff (team count)
  
Data Shown:
  - KPI Cards:
    * Today's Bookings (count)
    * Pending Bookings (count)
    * Team Members (count)
    * Revenue (this month)
  - Recent Bookings list (last 5)
  - Alerts/Notifications section
  - Quick Actions: New Booking, New Service, View Reports
  
State Handling:
  ✅ loading: skeleton cards
  ✅ partial data: show available metrics
  ✅ error on any single metric: show error card for that metric only
  ✅ success: full dashboard
  
Actions:
  - New Booking link to /app/business-admin/bookings/create
  - View All link to detail pages
  - Alert click to relevant page
  
Components:
  - PageLayout
  - KPICard component (reusable)
  - DataTable for recent items
  - Error boundary per card

Backend Requirements:
  - GET /api/dashboard/business returns aggregated KPIs
  - OR individual endpoints return correct data structure
```

#### KoraAdminDashboardPage (/app/platform-admin)
```
Purpose: Platform control center for platform admins

Data to Fetch (on mount):
  GET /api/platform/dashboard (aggregated platform metrics)
  Fallback endpoints:
    - GET /api/tenants (count)
    - GET /api/users (count)
    - GET /api/subscriptions (active count)
    - GET /api/revenue/summary (total)
    - GET /health (system health)
  
Data Shown:
  - Global KPI Cards:
    * Total Tenants
    * Active Subscriptions
    * Total Revenue (YTD or current period)
    * Platform Health
  - Recent Alerts / Incidents
  - Tenant status summary
  - links to admin modules: Users, Tenants, Revenue, Health, Features
  
State Handling:
  ✅ loading: skeleton
  ✅ error: graceful degradation per component
  ✅ success: full dashboard with all metrics
  
Actions:
  - Links to admin modules
  - Drill-down to detail pages
  
Components:
  - PageLayout
  - KPICard
  - Alert list
  - Error boundary

Backend Requirements:
  - GET /api/platform/dashboard or individual endpoints
```

#### AIDashboardPage (/dashboard/ai)
```
Purpose: AI usage and monetization dashboard (for business_admin)

Data to Fetch (on mount):
  GET /api/ai/metrics/live (real-time AI metrics)
  Fallback:
    - GET /api/ai/usage/providers (provider breakdown)
    - GET /api/ai/usage/summary (total usage and spend)
    - GET /api/ai/budget (budget configuration)
  
Data Shown:
  - AI Usage Overview:
    * Requests this month
    * Success rate (%)
    * Avg response time (ms)
  - Provider Breakdown (pie/bar chart):
    * Claude usage
    * OpenAI usage
    * Google usage
    * Mistral usage
  - Cost Tracking:
    * Est. cost this month
    * Budget limit
    * % of budget used
  - Recent AI Actions table:
    * Action type
    * Model used
    * Tokens/cost
    * Result
  - Suggestions:
    * Upgrade button if near limit
    * Disable AI button if toggling needed
  
State Handling:
  ✅ loading: skeleton dashboard
  ✅ empty: "No AI activity yet"
  ✅ error: error card with retry
  ✅ partial: show available metrics
  
Actions:
  - View Action Details
  - Upgrade Plan button → /billing
  - Disable AI toggle (if applicable)
  - Set Budget Limit form
  
Components:
  - PageLayout
  - MetricCard
  - Chart (provider breakdown)
  - DataTable (recent actions)
  - Cost progress bar
  - Error boundary

Backend Requirements:
  - GET /api/ai/metrics/live returns {total_requests, success_rate, avg_response_ms, provider_usage: {}, cost_est}
  - GET /api/ai/usage/providers returns provider breakdown
  - GET /api/ai/budget returns {monthly_budget_usd, spent_usd, limit_enabled}
  
Actions:
  - PATCH /api/ai/budget {enabled, monthly_limit_usd}
  - POST /api/ai/disable (if supported)
```

#### BillingPage (/billing)
```
Purpose: Subscription management and plan upgrade page

Data to Fetch (on mount):
  GET /api/subscriptions?current=true (current subscription)
  GET /api/billing/plans (available plans)
  GET /api/auth/me (tenant context)
  
Data Shown:
  - Current Plan card:
    * Plan name (BASIC, PRO, BUSINESS, ENTERPRISE)
    * Features included
    * Billing cycle (monthly/annual)
    * Next billing date
    * Cancel button
  - Available Plans grid:
    * Plan cards with pricing
    * Features list per plan
    * Upgrade button per plan
  - Billing History:
    * Recent invoices (last 5)
    * Date, amount, status, download PDF link
  - Payment Methods:
    * Saved cards
    * Add payment method button
  
State Handling:
  ✅ loading: skeleton cards
  ✅ error: error message with contact support link
  ✅ success: full billing page
  ✅ processing: disable buttons during payment
  
Actions:
  - Upgrade Plan → opens Paystack/Stripe checkout
  - Download Invoice → generates/downloads PDF
  - Update Payment Method → card form
  - Cancel Subscription → confirmation dialog
  
Components:
  - PageLayout
  - Plan card (reusable, shows "Current" badge if active)
  - Billing history table
  - Payment method form
  - Checkout modal or redirect handler
  - Error boundary

Backend Requirements:
  - GET /api/subscriptions returns {id, plan, status, billing_cycle, next_billing_date}
  - GET /api/billing/plans returns [{id, name, features, price_cents, interval}]
  - POST /api/billing/initialize {plan_id} → {payment_url}
  - POST /api/billing/verify {reference} → {status}
```

### C. LIST/DETAIL/CRUD PAGES (Standard CRUD Pattern)

#### Bookings Module
```
Lists:       /app/business-admin/bookings (BookingsListPage)
Detail:      /app/business-admin/bookings/:id (BookingsDetailPage)
Create:      /app/business-admin/bookings/create (CreateBookingPage)
Edit:        /app/business-admin/bookings/:id/edit (EditBookingPage)

Backend Endpoints:
  GET /api/bookings (list with filters)
  GET /api/bookings/:id (detail)
  POST /api/bookings (create)
  PATCH /api/bookings/:id (update)
  DELETE /api/bookings/:id (cancel)

Common State Handling:
  ✅ loading
  ✅ empty: "No bookings"
  ✅ error: show error with retry
  ✅ success: render data
  ✅ 404: "Booking not found"
  ✅ 403: "You don't have permission"
  
Actions:
  - Create new booking
  - View booking details
  - Edit booking (if status allows)
  - Cancel booking (if status allows)
  - Reschedule booking
```

#### Clients Module
```
Lists:       /app/business-admin/crm (ClientsListPage or LeadsPage if separate)
Detail:      /app/business-admin/crm/:id (ClientsDetailPage)
Create:      /app/business-admin/crm/create (CreateClientPage)
Edit:        /app/business-admin/crm/:id/edit (EditClientPage)

Backend Endpoints:
  GET /api/clients (list)
  GET /api/clients/:id (detail)
  POST /api/clients (create)
  PATCH /api/clients/:id (update)
  DELETE /api/clients/:id (soft delete)
  
Actions:
  - Add new client
  - View client history/bookings
  - Edit client info
  - View loyalty points if applicable
```

#### Services Module
```
Lists:       /app/business-admin/services (ServicesListPage)
Detail:      /app/business-admin/services/:id (ServicesDetailPage)
Create:      /app/business-admin/services/create (CreateServicePage)
Edit:        /app/business-admin/services/:id/edit (EditServicePage)

Backend Endpoints:
  GET /api/services (list)
  GET /api/services/:id (detail)
  POST /api/services (create)
  PATCH /api/services/:id (update)
  DELETE /api/services/:id (archive/soft delete)

Actions:
  - Create service
  - View service details
  - Edit service (pricing, duration, category)
  - Archive service
```

#### Staff Module
```
Lists:       /app/business-admin/staff (StaffListPage)
Detail:      /app/business-admin/staff/:id (StaffDetailPage)
Create:      /app/business-admin/staff/create (CreateStaffPage)
Edit:        /app/business-admin/staff/:id/edit (EditStaffPage) [if exists]

Backend Endpoints:
  GET /api/staff (list)
  GET /api/staff/:id (detail + performance metrics)
  POST /api/staff (create)
  PATCH /api/staff/:id (update)
  DELETE /api/staff/:id (archive)
  GET /api/staff/:id/schedule (staff availability)

Actions:
  - Hire new staff
  - View staff details & performance
  - Update staff info
  - Set staff availability/schedule
  - Deactivate staff
```

#### Inventory Module
```
Lists:       /app/business-admin/inventory (InventoryItemsPage)

Backend Endpoints:
  GET /api/inventory (list)
  GET /api/inventory/:id (detail)
  POST /api/inventory (create item)
  PATCH /api/inventory/:id (update stock)

Actions:
  - Add inventory item
  - Update stock quantity
  - Set reorder alerts
```

#### Leads/CRM Module
```
Lists:       /app/business-admin/leads (LeadsPage or separate CRM list)

Backend Endpoints:
  GET /api/crm/leads (list)
  GET /api/crm/leads/:id (detail)
  POST /api/crm/leads (create)
  PATCH /api/crm/leads/:id (update status, score)

Actions:
  - Add new lead
  - Update lead status
  - Convert to client
  - Add notes
```

#### Payments Module
```
Lists:       /app/business-admin/payments (PaymentsListPage)

Backend Endpoints:
  GET /api/payments (list with filters: status, date range, etc.)
  
Data Shown:
  - Transaction ID
  - Date
  - Amount
  - Gateway (Stripe, Paystack, PayPal, etc.)
  - Status (completed, pending, failed)
  - Client name

Action:
  - View transaction details
  - Refund payment (if applicable)
```

#### Delivery Module
```
Lists:       /app/operations/delivery/bookings (DeliveryBookingsPage)
Dispatch:    /app/operations/dispatch-dashboard (DispatchDashboard with GPS)

Backend Endpoints:
  GET /api/delivery/bookings (list)
  GET /api/delivery/agents (list active agents)
  GET /api/delivery/bookings/:id (detail)
  PATCH /api/delivery/bookings/:id (update status)

Data Shown:
  - Booking ID
  - Pickup/Dropoff addresses
  - Status (pending, assigned, in_transit, delivered)
  - Assigned agent
  - GPS tracking (if agent assigned)

Actions:
  - Assign delivery
  - Track delivery
  - Mark as delivered
  - Update customer
```

### D. ADMIN-ONLY PAGES

#### System Health Page (/app/platform-admin/health)
```
Purpose: Platform infrastructure monitoring

Data to Fetch (on mount):
  GET /health (backend health check)
  GET /api/platform/health (internal services status)
  GET /api/platform/incidents (recent issues)
  
Data Shown:
  - Service Status Grid:
    * Backend API: ✅ OK
    * PostgreSQL: ✅ OK
    * Redis: ✅ OK
    * Workers: ✅ OK
  - Performance Metrics:
    * API response time (P95, P99)
    * DB query time (avg)
    * Cache hit rate (%)
  - Recent Incidents/Alerts:
    * Timestamp
    * Severity
    * Description
    * Status
  - Uptime (last 30 days)

State Handling:
  ✅ live: refresh every 30 seconds
  ✅ degraded: show warning colors
  ✅ error: show which services are down
  
Components:
  - PageLayout
  - Status cards with color coding
  - Metric chart
  - Incident list

Backend Requirements:
  - GET /health returns {status, service, checks: {database: {healthy, ...}}}
  - GET /api/platform/health returns service statuses
  - GET /api/platform/incidents returns recent issues
```

#### Feature Flags Page (/app/platform-admin/features)
```
Purpose: Feature toggle management

Data to Fetch (on mount):
  GET /api/platform/feature-flags (list of all flags)
  
Data Shown:
  - Feature flags table:
    * Flag name
    * Current value (true/false or percentage)
    * Target scope (platform-wide, tenant, user)
    * Last modified
    * Modified by
  - Enable new flag form
  
State Handling:
  ✅ loading: skeleton table
  ✅ empty: "No feature flags configured"
  ✅ error: error message
  
Actions:
  - Toggle flag on/off
  - Set percentage rollout
  - Delete flag
  - Create new flag (form)
  - Set target scope

Backend Requirements:
  - GET /api/platform/feature-flags returns [{id, name, enabled, percentage, scope, created_at, updated_by}]
  - PATCH /api/platform/feature-flags/:id {enabled, percentage} 
  - DELETE /api/platform/feature-flags/:id
  - POST /api/platform/feature-flags {name, enabled, percentage}

Components:
  - PageLayout
  - DataTable (flags)
  - Toggle switch
  - Flag form modal
  - Error boundary
```

#### Tenant Management (/app/platform-admin/tenants)
```
Purpose: Multi-tenant administration

Lists:       GET /api/tenants
Detail:      /app/platform-admin/tenants/:id
Create:      /app/platform-admin/tenants/create
Edit:        /app/platform-admin/tenants/:id/edit

Data Shown (list):
  - Tenant name
  - Plan / Subscription status
  - Users count
  - Created date
  - Status (active, suspended, deleted)
  - Monthly/annual revenue

Detail:
  - Full tenant info
  - Subscription schedule
  - User accounts
  - API keys / integrations
  - Usage stats
  - Billing details

Actions:
  - Create new tenant
  - Suspend/reactivate tenant
  - Update plan
  - View usage/revenue
  - Reset API keys

Backend Requirements:
  - GET /api/tenants returns [{id, name, plan, status, users_count, created_at, mru_cents}]
  - GET /api/tenants/:id returns full tenant + subscription + usage
  - POST /api/tenants {name, email, plan} → returns {id, ...}
  - PATCH /api/tenants/:id {status, plan}
```

#### Subscriptions (/app/platform-admin/subscriptions)
```
Purpose: Global subscription management

Data Shown:
  - All active subscriptions
  - Tenant association
  - Plan
  - Billing cycle
  - Renewal date
  - Auto-renew status
  - Revenue

Actions:
  - View subscription details
  - Update plan
  - Cancel subscription
  - Issue refund
  - View billing history

Backend Requirements:
  - GET /api/subscriptions returns [{id, tenant_id, plan, cycle, renews_at, auto_renew, revenue_cents}]
  - GET /api/subscriptions/:id
  - PATCH /api/subscriptions/:id {plan, auto_renew}
```

#### User Management (/app/platform-admin/users)
```
Purpose: Platform-wide user administration

Data Shown:
  - Email
  - Tenant/Organization
  - Role
  - Status (active, suspended, deleted)
  - Last login
  - Created date

Actions:
  - Suspend user
  - Reset password
  - Change role
  - Delete user
  - View user activity

Backend Requirements:
  - GET /api/users (platform-wide)
  - GET /api/users?role=platform_admin (filter)
  - PATCH /api/users/:id {role, status}
```

#### Support Tools (/app/platform-admin/support)
```
Purpose: Support ticket management for platform admins

Data Shown:
  - Support tickets list
  - Tenant / User association
  - Subject
  - Status
  - Priority
  - Created date
  - Assigned to (if applicable)

Actions:
  - View ticket details
  - Assign ticket
  - Change status
  - Add internal notes
  - View ticket history

Backend Requirements:
  - GET /api/support/tickets (all platform tickets)
  - GET /api/support/tickets/:id
  - PATCH /api/support/tickets/:id {status, assigned_to}
  - POST /api/support/tickets/:id/notes {note, internal}
```

#### AI Usage (/app/platform-admin/ai-usage)
```
Purpose: Platform-wide AI cost tracking

Data Shown:
  - Total requests this month
  - Total tokens processed
  - Estimated cost (USD)
  - Provider breakdown (pie chart):
    * Claude
    * OpenAI
    * Google
    * Mistral
  - Top tenants by AI usage
  - Tenant limits & budgets

Actions:
  - View provider details
  - Set per-tenant budget limits
  - View top requests
  - Monitor anomalies

Backend Requirements:
  - GET /api/ai/usage/summary returns {total_requests, total_tokens, est_cost_usd, provider_breakdown}
  - GET /api/ai/usage/by-tenant returns tenant-level usage
```

#### Revenue (/app/platform-admin/revenue)
```
Purpose: Platform revenue and financial metrics

Data Shown:
  - Total revenue (daily, monthly, YTD)
  - Revenue by plan (pie/bar chart)
  - Revenue by tenant (top 10)
  - Churn rate
  - Subscription trends
  - Refunds / Chargebacks

Actions:
  - Export report
  - Filter by date range
  - View subscription journey

Backend Requirements:
  - GET /api/revenue/summary {total_ytd, monthly_breakdown, by_plan, by_tenant, churn_rate}
  - GET /api/revenue/details (detailed transactions)
```

---

## 5. API BINDING AND DATA NORMALIZATION PLAN

### API Client Configuration
```typescript
// src/services/api.ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Auth Token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const orgId = localStorage.getItem('organizationId');;
  if (orgId && config.url?.startsWith('/api/')) {
    config.headers['X-Organization-ID'] = orgId;
  }
  return config;
});

// Response Interceptor: Handle Auth/Errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth, redirect to /login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Response Normalization Helpers
```typescript
// src/services/normalizers.ts

// Handle nested/flat booking responses
export function normalizeBooking(raw: any) {
  return {
    id: raw.id,
    clientName: raw.client?.name || raw.client_name,
    serviceName: raw.service?.name || raw.service_name,
    startTime: new Date(raw.start_time),
    endTime: new Date(raw.end_time),
    status: raw.status,
    staffName: raw.staff?.name || raw.staff_name,
  };
}

// Handle nested/flat user responses
export function normalizeUser(raw: any) {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    organizationId: raw.organization_id || raw.organizationId,
  };
}

// Safe JSON rendering
export function safeRenderValue(value: any) {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.length > 0 ? `[${value.length} items]` : '[]';
    }
    return `[Object]`;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (!value) return '-';
  return String(value);
}
```

### Error Envelope Handling
```typescript
// src/types/api.ts

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  status: number;
}

// Parse response
export function parseAPIResponse<T>(response: any): T {
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data;
}
```

### Hook for Safe Data Fetching
```typescript
// src/hooks/useSafeQuery.ts

export function useSafeQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: any
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn();
        return response;
      } catch (error: any) {
        // Convert HTML response to meaningful error
        if (error.response?.headers['content-type']?.includes('text/html')) {
          throw new Error('Server error - received HTML instead of JSON');
        }
        throw error;
      }
    },
    ...options,
  });
}
```

---

## 6. ERROR AND EMPTY STATE PLAN

### Standard Error Handling Strategy

#### 400 Bad Request
```typescript
// Render error form with field-level feedback
<ErrorAlert 
  title="Invalid Input"
  message="Please check the fields below and try again."
>
  {fieldErrors.map(error => (
    <FieldError key={error.field} field={error.field} message={error.message} />
  ))}
</ErrorAlert>
```

#### 401 Unauthorized
```typescript
// Clear auth, redirect to /login
useEffect(() => {
  if (error?.response?.status === 401) {
    localStorage.clear();
    window.location.href = '/login';
  }
}, [error]);
```

#### 403 Forbidden
```typescript
<ErrorAlert 
  title="Access Denied"
  message="You don't have permission to view this resource."
/>
// Optionally redirect to /app with default role
```

#### 404 Not Found
```typescript
<CenteredCard>
  <h2>Not Found</h2>
  <p>The {resourceType} you're looking for doesn't exist or was deleted.</p>
  <Button onClick={() => navigate(-1)}>Go Back</Button>
  <Button onClick={() => navigate(`/app/${role}`)}>Go To Dashboard</Button>
</CenteredCard>
```

#### 500 Server Error
```typescript
<ErrorAlert 
  title="Server Error"
  message="Something went wrong. Please try again later."
>
  <Button onClick={() => refetch()}>Retry</Button>
  <Button onClick={() => reportError(error)}>Report Issue</Button>
</ErrorAlert>
```

#### Network Failure / Timeout
```typescript
<ErrorAlert 
  title="Connection Error"
  message="Unable to connect to server. Check your internet connection."
>
  <Button onClick={() => refetch()}>Retry</Button>
</ErrorAlert>
```

### Empty State Handling

#### No Data
```typescript
{data?.length === 0 ? (
  <EmptyState
    icon="📭"
    title="No bookings yet"
    description="Create your first booking to get started."
    action={<Button onClick={() => navigate('/create')}>Create Booking</Button>}
  />
) : (
  <DataTable data={data} />
)}
```

#### No Search Results
```typescript
{results.length === 0 ? (
  <EmptyState
    title="No results"
    description="Try adjusting your search filters."
    action={<Button onClick={clearFilters}>Clear Filters</Button>}
  />
) : (
  <DataTable data={results} />
)}
```

#### No Permissions
```typescript
<ForbiddenPage 
  message="You don't have permission to access this module."
  contactSupport={true}
/>
```

### Standard Components

```typescript
// src/components/common/ErrorAlert.tsx
export function ErrorAlert({ title, message, children, retry }) {
  return (
    <div className="alert alert-error">
      <h3>{title}</h3>
      <p>{message}</p>
      {children}
      {retry && <Button onClick={retry}>Retry</Button>}
    </div>
  );
}

// src/components/common/EmptyState.tsx
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

// src/components/common/LoadingState.tsx
export function LoadingState({ type = 'skeleton' }) {
  if (type === 'spinner') {
    return <div className="spinner">Loading...</div>;
  }
  return <SkeletonList count={5} />;
}
```

---

## 7. MENU CLEANUP AND VISIBILITY RULES

### What to REMOVE from Navigation
1. **Dead routes**:
   - `/app/kora-admin/*` paths (use platform_admin alias → `/app/platform-admin`)
   - `/app/dashboard/*` (consolidate into role dashboards)
   - `/app/marketplace` (not in backend scope)
   - `/app/kora-admin/fraud`, `/security`, `/moderation` (not implemented)

2. **Duplicate items**:
   - Remove "Marketplace" if not proven in Prompt 1
   - Consolidate duplicate menu items

3. **Unimplemented modules**:
   - `/app/planning/*` (internal, hidden)
   - `/emergency` (not fully implemented)
   - Any route pointing to NotFoundPage or "Route not found"

### What to HIDE from Navigation (Routes exist, but not in menu)
1. `/app/*/create`, `/edit`, `/detail` - accessed via action buttons, not top-level menu
2. `/app/*/settings` - sub-section of Settings menu item
3. `/search` - optional, not primary navigation

### What to RENAME
1. "Workspace" → Role-specific dashboard (Dashboard, Staff Portal, Operations Center, Admin Panel)
2. "Modules" → Specific module names (Bookings, Staff, Services, etc.)
3. "Platform Control": Keep as "Platform" (shorter, clearer)

### What to REGROUP
1. Client-only routes under "My Account" section
2. Operations routes under "Live Operations" section
3. Admin routes under "Administration" container
4. Tenant management routes under separate "Tenant Management" group

### Visibility Rules (By Role)

```typescript
const menuVisibility = {
  client: [
    'Dashboard',
    'Services',
    'Account',
  ],
  staff: [
    'My Work',
    'Customers',
    'Field',
  ],
  business_admin: [
    'Dashboard',
    'Operations',
    'Customers',
    'Team',
    'Services',
    'Finance',
    'Marketing',
    'Settings',
  ],
  operations: [
    'Live Operations',
    'Emergency',
    'Support',
    'Delivery',
  ],
  platform_admin: [
    'Platform',
    'Tenants',
    'Trust & Safety',  // removed fraud/security/moderation items from under this
    'Admin',
  ],
};
```

---

## 8. FILE-LEVEL IMPLEMENTATION CHECKLIST

### Core Navigation Files
- [ ] `src/config/navigation.ts` - Update routes, remove dead paths, fix visibility
- [ ] `src/components/layout/Sidebar.tsx` - Update menu items, fix navigation structure
- [ ] `src/components/layout/AppShell.tsx` - Ensure role-based rendering

### Core Routing
- [ ] `src/App.tsx` - Fix route definitions, remove dead routes, add missing routes
- [ ] `src/components/auth/RequireAuthLayout.tsx` - Validate auth flow
- [ ] `src/components/auth/DashboardRouteGuard.tsx` - Fix default redirects

### API & Data Layer
- [ ] `src/services/api.ts` - Fix axios config, interceptors, JSON parsing
- [ ] `src/hooks/useQuery.ts` or similar - Add error handling, retries
- [ ] Create `src/services/normalizers.ts` - Data transformation helpers
- [ ] Create `src/hooks/useSafeQuery.ts` - Safe query wrapper

### Login & Auth
- [ ] `src/pages/LoginPage.tsx` - ✅ WORKING (already fixed)
- [ ] `src/contexts/AuthContext.tsx` - Ensure token persistence, role extraction

### Dashboard Pages (PRIORITY)
- [ ] `src/pages/audience/ClientWorkspacePage.tsx` - Create/fix client dashboard
- [ ] `src/pages/audience/StaffWorkspacePage.tsx` - Create/fix staff dashboard
- [ ] `src/pages/audience/BusinessAdminDashboardPage.tsx` - Create/fix business dashboard
- [ ] `src/pages/audience/KoraAdminDashboardPage.tsx` - Create/fix admin dashboard
- [ ] `src/pages/ai/AIDashboardPage.tsx` - Fix AI monetization dashboard
- [ ] `src/pages/billing/BillingPage.tsx` - Fix billing/subscription page

### Admin Pages
- [ ] `src/pages/platform-admin/SystemHealthPage.tsx` - Create **NEW**
- [ ] `src/pages/platform-admin/FeatureFlagsPage.tsx` - Verify/fix
- [ ] `src/pages/platform-admin/UsersPage.tsx` - Verify/fix
- [ ] `src/pages/platform-admin/AIUsagePage.tsx` - Fix
- [ ] `src/pages/platform-admin/RevenuePage.tsx` - Verify/fix

### CRUD Pages (Verify existing implementations)
- [ ] `src/pages/bookings/ListPageEnhanced.tsx` - Verify data binding
- [ ] `src/pages/services/ListPageEnhanced.tsx` - Verify data binding
- [ ] `src/pages/clients/ListPageEnhanced.tsx` - Verify data binding
- [ ] `src/pages/staff/ListPageEnhanced.tsx` - Verify data binding
- [ ] All `*DetailPage.tsx` files - Ensure 404 handling
- [ ] All `*CreatePage.tsx` files - Ensure form validation
- [ ] All `*EditPage.tsx` files - Ensure prefill and save

### Common Components
- [ ] `src/components/common/ErrorAlert.tsx` - Create **NEW**
- [ ] `src/components/common/EmptyState.tsx` - Create **NEW**
- [ ] `src/components/common/LoadingState.tsx` - Create **NEW**
- [ ] `src/components/PageLayout.tsx` - Already exists, verify used everywhere
- [ ] `src/components/DataTable.tsx` - Already exists, verify pagination/filtering

### Error Boundaries
- [ ] `src/components/ErrorBoundary.tsx` - Create or update **NEW**
- [ ] Wrap all pages with error boundary

### Context & Stores
- [ ] `src/contexts/AuthContext.tsx` - Verify auth state management
- [ ] `src/stores/appStore.ts` (or similar) - Verify organization/role context
- [ ] `src/hooks/useAuth.ts` - Create if needed **NEW**

### Utilities & Helpers
- [ ] `src/utils/errorHandling.ts` - Create error parsing **NEW**
- [ ] `src/utils/formatting.ts` - Number/date formatting
- [ ] `src/utils/validation.ts` - Form validation helpers

### Remove These Files (Dead Code)
- [ ] `src/pages/audience/DynamicPage.tsx` (if exists - replace with real pages)
- [ ] `src/pages/marketplace/MarketplaceIntelligencePage.tsx` (unless proven)
- [ ] Any other `.placeholder.tsx` or `.draft.tsx` files

---

## 9. SAFE IMPLEMENTATION ORDER

### **Phase 1: Foundation (Day 1)**
1. Fix API client (`api.ts` - axios config, interceptors, error handling)
2. Create normalizer helpers (`src/services/normalizers.ts`)
3. Create error & empty state components
4. Update AuthContext to store org context correctly
5. Test: Login flow works, token persisted, org ID available

### **Phase 2: Navigation (Day 1-2)**
6. Clean `src/config/navigation.ts` - remove dead routes, fix visibility rules
7. Update `src/components/layout/Sidebar.tsx` to match cleaned navigation
8. Update `src/App.tsx` route definitions to match navigation config
9. Test: All menu items navigate to real pages, no "Route not found"

### **Phase 3: Dashboards (Day 2-3)**
10. Fix `ClientWorkspacePage` - fetch real data, handle states
11. Fix `BusinessAdminDashboardPage` - aggregate real KPIs
12. Fix `StaffWorkspacePage` - show today's jobs
13. Fix `KoraAdminDashboardPage` - show platform KPIs
14. Test: Each dashboard loads data, handles empty/error states

### **Phase 4: Admin Pages (Day 3-4)**
15. Create `SystemHealthPage` - fetch /health endpoint
16. Fix `FeatureFlagsPage` - fetch flags, implement toggle
17. Fix `AIUsagePage` - fetch AI metrics
18. Fix `RevenuePage` - fetch revenue data
19. Fix `UsersPage` - fetch platform users
20. Test: All admin pages show real data, actions work

### **Phase 5: CRUD Validation (Day 4-5)**
21. Audit all `ListPageEnhanced.tsx` files - verify API binding
22. Audit all `*DetailPage.tsx` - verify 404, 403 handling
23. Audit all `*CreatePage.tsx` - verify form, validation
24. Audit all `*EditPage.tsx` - verify prefill, update
25. Test: All CRUD operations work with validation, error handling

### **Phase 6: Billing & AI (Day 5)**
26. Fix `AIDashboardPage` - fetch AI metrics, show cost tracking
27. Fix `BillingPage` - fetch subscriptions, show plans, support checkout
28. Test: AI dashboard shows real data, billing flow works

### **Phase 7: Error Boundaries (Day 6)**
29. Wrap all pages with ErrorBoundary component
30. Test: No React crashes, graceful error display

### **Phase 8: Final Validation (Day 6-7)**
31. Test each role navigation (client, staff, business_admin, operations, platform_admin)
32. Test permission enforcement (no "Forbidden" pages visible to wrong roles)
33. Test error states (401, 403, 404, 500, network failure)
34. Test empty states (no bookings, no users, etc.)
35. Test data rendering (no raw objects, clean formatting)

---

## 10. ACCEPTANCE CRITERIA

### ✅ Must Be True

#### Navigation & Routing
- [ ] No "Route not found" message visible anywhere in UI
- [ ] No "This workspace does not exist yet" message visible
- [ ] Every sidebar menu item navigates to a working page
- [ ] No dead links in any page
- [ ] URL path matches page purpose

#### Data & API
- [ ] All pages fetch data from correct backend endpoints
- [ ] No HTML/JSON parsing errors in console
- [ ] All nested/flat response objects normalized before rendering
- [ ] No raw `[object Object]` rendered in UI
- [ ] All arrays safely mapped (no `.map()` rendering objects)

#### Error Handling
- [ ] 401 → Auto-redirect to /login, token cleared
- [ ] 403 → Show Forbidden page, stay on current page
- [ ] 404 → Show "Not found" card with back button
- [ ] 500 → Show error card with retry button
- [ ] Network timeout → Show retry option
- [ ] Empty data → Show empty state with action (create, filter, etc.)

#### State Management
- [ ] All pages show loading state while fetching
- [ ] All pages handle partial data (some metrics fail, others succeed)
- [ ] No mixed loading/error states (not both spinner and error)
- [ ] Form fields disable during submission
- [ ] Success confirmations show before navigation

#### Role Visibility
- [ ] Client users only see client pages and navigation
- [ ] Staff users only see staff pages and navigation
- [ ] Business admins can see operations, CRUD, billing, AI pages
- [ ] Platform admins can see all admin pages
- [ ] No admin functionality visible to non-admin users

#### Monetization
- [ ] AI Dashboard shows real provider usage
- [ ] Billing page shows current plan and upgrade options
- [ ] Subscription status is accurate and reflected in page access
- [ ] Cost tracking is visible and accurate

#### Performance
- [ ] No console errors on page load
- [ ] Lazy loading works (pages load asynchronously)
- [ ] Images/assets load correctly
- [ ] Search/filter is responsive (debounced)
- [ ] Tables paginate/virtualize if > 100 items

#### Security
- [ ] JWT tokens used, not localStorage passwords
- [ ] Auth headers sent on all protected requests
- [ ] CSRF exempted from /api/auth/* endpoints only
- [ ] No sensitive data in localStorage except token + org
- [ ] Logout clears all storage

### 🔴 Must NOT Be True

- [ ] ❌ No placeholder/draft pages visible
- [ ] ❌ No pages rendering raw objects
- [ ] ❌ No HTML parsed as JSON
- [ ] ❌ No broken images/assets
- [ ] ❌ No console errors on normal usage
- [ ] ❌ No unauthorized role access to admin pages
- [ ] ❌ No unauthenticated access to protected pages
- [ ] ❌ No dead routes in sidebar
- [ ] ❌ No mixing of data from different roles/orgs
- [ ] ❌ No missing error boundaries

---

## IMPLEMENTATION COMMANDS

### Build & Test
```bash
# Frontend
cd frontend
npm install
npm run dev          # Start dev server
npm run build        # Test build

# Type checking
npm run typecheck

# Test
npm run test         # If tests exist
```

### Verify After Each Phase
```bash
# Phase 1: API layer
curl -X GET http://localhost:3000/health

# Phase 2: Navigation
Navigate to each /app/* route via sidebar

# Phase 3-6: Pages
Test login → navigate to role-specific dashboard → fetch data

# Phase 7-8: Error handling
Test 401: Logout, try to access /app/business-admin
Test 403: Try to access /app/platform-admin as non-admin
Test 404: Navigate to /app/business-admin/bookings/nonexistent
Test empty: Delete all bookings, navigate to list
```

---

## SUMMARY

| Aspect | Current | Target |
|--------|---------|--------|
| **Routes** | 50+ mixed, many broken | 30+ clean, real + fallback |
| **Pages** | 40+ placeholder/shells | 25+ operational + CRUD |
| **Menu Items** | 60+ including dead | 35+ real path + hidden CRUD |
| **Navigation** | Role-aware but broken paths | Role-aware + verified paths |
| **Error Handling** | Missing | Standard: 401/403/404/500/timeout |
| **Empty States** | Inconsistent | Consistent: icon + message + action |
| **Data Binding** | API calls but no normalization | Normalized + safe rendering |
| **UI Stability** | Object render crashes | No crashes, graceful degradation |
| **Performance** | Lazy loading basic | Lazy + pagination + virtualization |
| **Security** | JWT exists, CSRF blocking auth | JWT + auth header + safe storage |

---

## NEXT STEPS

1. **Immediate**: Implement Phase 1-2 (API fixes, navigation cleanup)
2. **Then**: Implement Phase 3-4 (dashboards, admin pages)
3. **Then**: Implement Phase 5-6 (CRUD validation, billing/AI)
4. **Finally**: Implement Phase 7-8 (error boundaries, final validation)

Each phase includes verification steps to ensure stability before moving forward.

**Estimated Timeline**: 7-10 days for full implementation with testing
