# Current Repo To Blueprint Mapping

Scope: local repo `C:\Users\hp\KORA`
Date: 2026-03-08
Rule: this maps the current implemented schema direction to the new KORA core blueprint. It does not assume the blueprint is already applied.

## Ground Truth In Repo
Current migrations present:
- `001_init.sql`
- `002_ai_foundation.sql`
- `003_orchestration_feedback.sql`
- `004_schema_completion.sql`
- `005_payments.sql`
- `006_audience_schema.sql`
- `006b_seed_categories.sql`
- `007_booking_engine.sql`
- `008_service_registry.sql`
- `009_payments_real.sql`
- `010_communications.sql`

Current backend modules present:
- `ai`
- `analytics`
- `appointments`
- `auth`
- `availability`
- `bookings`
- `campaigns`
- `clients`
- `clinical`
- `discovery`
- `emergency`
- `finance`
- `notifications`
- `payments`
- `platform`
- `reporting`
- `services`
- `staff`

## Identity And Tenant Layer
Blueprint target:
- `tenants`
- `tenant_branches`
- `users`
- `roles`
- `permissions`
- `role_permissions`

Current repo state:
- `organizations` exists, not `tenants`
- `users` exists
- `staff_members` exists as an operational profile layer on top of `users`
- `roles/permissions` are not yet the dominant live access model in the current repo frontend/backend path
- Clerk `org_role` currently drives active authorization context in backend auth middleware

Mapping:
- `organizations` -> `tenants`
- missing/partial: `tenant_branches`
- `users` -> `users`
- missing/partial: enterprise RBAC tables as first-class core model
- `staff_members` should survive as the operational staff profile layer, likely attached to `users`

Decision:
- do not delete `staff_members`
- introduce `tenants` compatibility via either rename strategy or a compatibility view plan
- retain `users` as authentication identity table
- make `roles/permissions` authoritative later, after claim-to-role reconciliation

## CRM Layer
Blueprint target:
- `customers`
- `customer_ranks`
- `leads`
- `opportunities`
- `customer_feedback`

Current repo state:
- `clients` exists
- `loyalty_transactions` exists
- `reviews`/feedback capability is emerging in discovery direction
- no verified `leads`/`opportunities` core implementation in current live path

Mapping:
- `clients` -> `customers`
- `membership_tier` / `loyalty_points` in `clients` partially overlap with `customer_ranks` + loyalty account concepts
- missing: `customer_ranks`
- missing/partial: `leads`
- missing/partial: `opportunities`
- partial: customer review/feedback, but not yet normalized as `customer_feedback`

Decision:
- preserve `clients` data, evolve into `customers` or create a compatibility layer
- split loyalty tier/rank concerns cleanly later

## Service Catalog
Blueprint target:
- `service_categories`
- `services`
- `service_packages`
- `package_services`

Current repo state:
- `service_categories` exists
- `services` exists
- `venue_profiles`, `promotions`, `reviews` added in service/discovery direction
- no package model yet in verified repo path

Mapping:
- `service_categories` -> `service_categories`
- `services` -> `services`
- missing: `service_packages`
- missing: `package_services`

Decision:
- current service catalog is compatible and should be extended, not replaced

## Booking Core
Blueprint target:
- `bookings`
- `booking_status_history`
- `booking_notes`
- `emergency_requests`

Current repo state:
- `bookings` exists and has been extended across multiple migrations
- `appointments` module exists as an API surface around bookable objects
- `007_booking_engine.sql` introduces availability-side tables
- note/status support exists in module behavior but needs alignment to blueprint names
- emergency domain already exists in module form

Mapping:
- `bookings` -> `bookings`
- missing/partial: `booking_status_history` as canonical history table in final target model
- missing/partial: `booking_notes` as canonical table name
- partial/existing by domain: `emergency_requests`

Decision:
- keep `bookings` as the heart of the platform
- align API naming to treat appointments as a projection over bookings, not a divergent model

## Staff And Workforce
Blueprint target:
- `staff_profiles`
- `staff_schedules`
- `staff_locations`

Current repo state:
- `staff_members` exists
- availability engine uses recurring and override availability tables
- staff scheduling/location concepts exist partially through availability and operations work

Mapping:
- `staff_members` -> `staff_profiles`
- `availability_rules` / `availability_overrides` partially map to `staff_schedules`
- missing/partial: canonical `staff_locations`

Decision:
- do not collapse `staff_members`
- introduce `staff_profiles` as either rename target or compatibility abstraction
- map schedule logic carefully so current availability engine survives

## Operations / Dispatch
Blueprint target:
- `dispatch_jobs`
- `route_plans`

Current repo state:
- operations dashboard exists in frontend
- emergency module exists
- route/discovery/availability logic exists in parts
- no verified canonical `dispatch_jobs` table in current live migration set

Mapping:
- missing/partial: `dispatch_jobs`
- partial: `route_plans`

Decision:
- this is a true expansion area, not a cleanup area

## Inventory
Blueprint target:
- `warehouses`
- `inventory_items`
- `suppliers`
- `purchase_orders`
- `purchase_order_items`
- `maintenance_records`

Current repo state:
- inventory is not yet a first-class implemented schema area in the verified live repo path

Mapping:
- mostly missing

Decision:
- implement from blueprint with minimal collision risk

## Payments And Billing
Blueprint target:
- `payment_methods`
- `transactions`
- `invoices`
- `invoice_items`
- `subscriptions`

Current repo state:
- `transactions` exists
- `subscriptions` exists
- `stripe_customers` exists
- `payment_methods` introduced in `009_payments_real.sql`
- `refunds` exists in current repo direction
- `invoices` exists
- `invoice_items` not yet canonical in verified mapping

Mapping:
- `transactions` -> `transactions`
- `subscriptions` -> `subscriptions`
- `payment_methods` -> `payment_methods`
- `invoices` -> `invoices`
- missing/partial: `invoice_items`
- extra current tables worth preserving: `stripe_customers`, `transaction_splits`, `subscription_plans`, `insurance_claims`, `currency_rates`, `refunds`

Decision:
- billing layer is already richer than the blueprint in some parts
- preserve richer payment tables and align outward naming to blueprint where useful

## Marketing
Blueprint target:
- `campaigns`
- `promotions`

Current repo state:
- `campaigns` exists in direction of `010_communications.sql`
- `promotions` exists in discovery/service registry direction

Mapping:
- `campaigns` -> `campaigns`
- `promotions` -> `promotions`

Decision:
- compatible; keep and extend

## Loyalty
Blueprint target:
- `loyalty_accounts`
- `loyalty_transactions`

Current repo state:
- `loyalty_transactions` exists
- loyalty state currently also lives denormalized on `clients`

Mapping:
- `loyalty_transactions` -> `loyalty_transactions`
- missing/partial: `loyalty_accounts`

Decision:
- keep transaction ledger
- introduce dedicated balance account later to reduce duplicated source-of-truth risk

## Documents
Blueprint target:
- `documents`
- `document_permissions`

Current repo state:
- not yet first-class in verified live schema path

Mapping:
- mostly missing

## Messaging / Communication
Blueprint target:
- `messages`
- `notifications`

Current repo state:
- notifications module exists
- communication tables are partially introduced in `010_communications.sql`
- no verified canonical peer-to-peer `messages` table yet

Mapping:
- partial: `notifications`
- missing/partial: `messages`

## AI Layer
Blueprint target:
- `ai_models`
- `ai_predictions`

Current repo state:
- AI foundation already exists and is broader than the blueprint in some respects
- repo already includes orchestration and analytics AI layers

Mapping:
- partial overlap with `002_ai_foundation.sql` and orchestration tables
- `ai_predictions` can be introduced cleanly as a normalized prediction output table
- `ai_models` can be introduced cleanly as model registry/control metadata

Decision:
- preserve current AI foundation and add blueprint-normalized prediction/model registry tables on top

## Audit And Security
Blueprint target:
- `audit_logs`
- `login_sessions`

Current repo state:
- `audit_logs` already exists from early foundation
- login session tracking is currently handled more through external auth/session claims than internal normalized table storage

Mapping:
- `audit_logs` -> `audit_logs`
- missing/partial: `login_sessions`

## Marketplace
Blueprint target:
- `marketplace_listings`
- `marketplace_reviews`

Current repo state:
- discovery layer already added `venue_profiles` and `reviews`

Mapping:
- `venue_profiles` + `services` + published/discovery state -> `marketplace_listings`
- `reviews` -> `marketplace_reviews`

Decision:
- current discovery work should be evolved, not discarded

## Analytics
Blueprint target:
- `analytics_events`

Current repo state:
- analytics module exists
- reporting exists
- event capture table is not yet normalized to this exact blueprint target in verified schema review

Mapping:
- missing/partial: `analytics_events`

## System Configuration
Blueprint target:
- `system_settings`

Current repo state:
- no verified canonical `system_settings` table yet

Mapping:
- missing

## High-Risk Naming Conflicts
These must be resolved deliberately before schema-wide rollout:
- `organizations` vs `tenants`
- `clients` vs `customers`
- `staff_members` vs `staff_profiles`
- current mixed `users` + operational staff model vs blueprint's simplified `staff_profiles`
- current payment layer is richer than blueprint in some places and must not be simplified accidentally

## Keep Intact
These current repo investments should be preserved during reconciliation:
- calendar / scheduling engine
- availability engine work
- discovery and marketplace-facing venue/service work
- Stripe payment lifecycle work
- audience dashboards and operations centre
- Clerk-backed auth/session verification
