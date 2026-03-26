# Schema Reconciliation Plan

Scope: local repo `C:\Users\hp\KORA`
Date: 2026-03-08
Objective: move the current KORA implementation toward the new complete core blueprint without breaking the working scheduling engine, dashboards, payments work, or current auth path.

## Non-Negotiables
- preserve the existing calendar and scheduling engine
- preserve current frontend dashboard routes and role separation
- preserve current payments work that is richer than the blueprint
- preserve Clerk-backed auth verification as the live security source
- do not rename core tables blindly in one pass
- do not introduce dual sources of truth for bookings, payments, or staff identity

## Phase 1: Canonical Naming Strategy
Goal: decide which blueprint names become true table names versus compatibility abstractions.

Decisions required:
1. `organizations` vs `tenants`
2. `clients` vs `customers`
3. `staff_members` vs `staff_profiles`
4. `venue_profiles/reviews` vs `marketplace_listings/marketplace_reviews`

Recommended strategy:
- keep current live physical tables in the short term
- introduce blueprint-compatible views or repository aliases first
- delay hard renames until module code is consolidated

Recommended initial canonical mapping:
- `organizations` remains physical now, canonical domain meaning becomes `tenant`
- `clients` remains physical now, canonical domain meaning becomes `customer`
- `staff_members` remains physical now, canonical domain meaning becomes `staff_profile`
- `venue_profiles` and `reviews` remain physical now, canonical marketplace layer wraps them

Why:
- it avoids breaking current APIs and current frontend routes
- it keeps migration risk lower while the product is still actively changing

## Phase 2: Domain Stabilization Migrations
Goal: add missing blueprint domains without breaking current ones.

Safe first migrations after current `010`:
1. branches and tenant expansion
- add `tenant_branches` compatible table referencing current `organizations`
- connect bookings/services/users to branches where appropriate

2. CRM expansion
- add `customer_ranks`
- add `leads`
- add `opportunities`
- add normalized `customer_feedback`

3. service monetization expansion
- add `service_packages`
- add `package_services`

4. loyalty normalization
- add `loyalty_accounts`
- backfill from current `clients.loyalty_points`

5. inventory foundation
- add `warehouses`
- add `inventory_items`
- add `suppliers`
- add `purchase_orders`
- add `purchase_order_items`
- add `maintenance_records`

6. documents and messaging
- add `documents`
- add `document_permissions`
- add `messages`
- normalize notifications if needed

7. analytics and system config
- add `analytics_events`
- add `system_settings`
- add `login_sessions`

## Phase 3: Booking / Operations Consolidation
Goal: align scheduling and dispatch cleanly with the blueprint.

Actions:
- make `bookings` the single core operational object
- treat `appointments` module as an API/service layer over bookings, not a second domain model
- add or normalize:
  - `booking_status_history`
  - `booking_notes`
  - `dispatch_jobs`
  - `route_plans`
  - `staff_locations`
  - `emergency_requests` if current emergency schema does not already match

Protection rule:
- no change in this phase is allowed to break:
  - `/api/appointments`
  - `/api/bookings`
  - calendar move/resize/create behavior
  - availability calculations

## Phase 4: Marketplace Normalization
Goal: align discovery work with blueprint marketplace tables.

Actions:
- define marketplace repository model over current:
  - `venue_profiles`
  - `services`
  - `reviews`
- later decide whether to physically add:
  - `marketplace_listings`
  - `marketplace_reviews`
  or treat current tables as the implemented form

Recommendation:
- do not duplicate this physically yet
- keep current discovery layer and document the mapping in code

## Phase 5: Security And RBAC Completion
Goal: make internal RBAC tables authoritative while keeping Clerk claims as session truth.

Actions:
- add or complete:
  - `roles`
  - `permissions`
  - `role_permissions`
- map Clerk `org_role` to internal role ids
- introduce server-side role resolution table lookup after token verification
- keep frontend role behavior sourced from `/api/auth/me`

Target outcome:
- Clerk proves identity and org context
- internal DB proves permissions and module access

## Phase 6: Hard Rename Window
Goal: only after domain stabilization, decide whether to physically rename tables.

Candidates:
- `organizations` -> `tenants`
- `clients` -> `customers`
- `staff_members` -> `staff_profiles`

Recommendation:
- only do this if there is strong product/engineering value
- otherwise keep physical names and standardize the domain language in services, repositories, and docs

Reason:
- hard renames create heavy regression risk for little user-facing value if repository abstractions already solve the naming mismatch

## Backend Refactor Order
Recommended order in code:
1. add repository layer abstractions for blueprint terms
2. update modules to consume repositories, not raw table names directly
3. add missing schema tables
4. backfill data
5. only then consider physical renames

Priority repositories to introduce:
- `tenantRepository`
- `customerRepository`
- `staffProfileRepository`
- `bookingRepository`
- `billingRepository`
- `marketplaceRepository`

## Frontend Contract Strategy
Rules:
- do not expose raw physical-table naming drift to the frontend
- frontend contracts should move toward business language:
  - tenant
  - customer
  - staff profile
  - booking
  - marketplace listing
- maintain backward-compatible API responses while backend repositories are changing

## Migration Safety Rules
For every reconciliation migration:
- additive first
- backfill second
- switch reads third
- switch writes fourth
- deprecate old paths last

Never in one migration:
- rename and reshape and reindex core tables at the same time
- replace payment tables that already carry real transaction semantics
- break auth/session fields currently required by dashboards and guards

## Immediate Next Deliverables
Best next implementation set from the current repo:
1. create `011_tenant_crm_alignment.sql`
- add `tenant_branches`
- add `customer_ranks`
- add `leads`
- add `opportunities`
- add `customer_feedback`
- add `loyalty_accounts`

2. add repository abstraction layer
- tenant/customer/staff profile naming wrappers over current schema

3. update backend auth and module code to prefer domain language internally
- without breaking current API contracts

## Success Condition
The blueprint is considered successfully adopted when:
- current scheduling/calendar flows still work
- current dashboards still work
- current payment flows still work
- current auth/session checks still work
- missing blueprint domains have been added safely
- naming drift is either abstracted cleanly or migrated deliberately
