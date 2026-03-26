# KORA Part 1 - Exact Database Schema Map

## Scope And Evidence

This map is grounded only in repository source of truth:

- `backend/src/db/migrate.ts`
- `backend/src/db/migrations/000_extensions.sql` through `043_workflow_state_source_of_truth.sql`
- Mounted backend routes in `backend/src/app.ts`
- Active repositories and services under `backend/src/db/repositories`, `backend/src/modules`, `backend/src/workflows`
- Frontend contracts only where backend tables/routes are missing but the UI already depends on them, mainly support flows in `frontend/src/pages/support/*` and `frontend/src/types/index.ts`

Status labels used below:

- `KEEP`: already grounded in migrations and active code
- `MERGE`: duplicate concept exists in more than one schema family and must be consolidated
- `ADD`: required by active code or active UI contract but missing from migrations
- `DROP`: legacy or duplicate after cutover
- `DEFER`: requested in the prompt, but the repo does not contain enough contract detail to define safely without invention

## Global Rules

- Primary keys remain `uuid` unless the repo already uses a stable natural key.
- Every tenant-scoped mutable table must carry `organization_id uuid not null references organizations(id)`.
- `tenant_branches` is the live branch/location table. Do not introduce a second `organization_locations` table; alias the concept to `tenant_branches`.
- Mutable operational tables need both `created_at` and `updated_at`. The current repo is inconsistent here.
- Immutable history and ledger tables must not use soft delete.
- Current state may live on the aggregate row for fast reads, but history must live in immutable tables.
- Cross-entity workflow history should converge on `workflow_states` + `workflow_transitions`. Entity-specific history tables that only duplicate those semantics should be retired after compatibility cutover.

## Canonical Entity Register

### 1. Tenant Root, IAM, Governance

| Entity | Status | Purpose / ownership domain | Key fields | Foreign keys and scope | States / indexes / audit / retention |
| --- | --- | --- | --- | --- | --- |
| `organizations` | `MERGE` | Canonical tenant root for platform, provider org, clinic, pharmacy, salon, logistics operator | `id`, `name`, `ai_plan`, must add `industry`, `status`, `updated_at` because mounted tenant/platform code already uses them | Root table; referenced by almost every tenant table | Add `status` enum `pending_activation, active, paused, suspended, archived`; index on `(status, created_at)`; never hard delete in prod; audit all admin mutations |
| `businesses` | `DROP` | Duplicate tenant root introduced by `025_canonical_schema.sql` | `id`, `owner_user_id`, `name`, `slug`, address fields | No mounted route uses it as canonical tenant root; seed still writes here | Keep only as temporary migration source if data exists; migrate into `organizations` + `venue_profiles`; then delete |
| `tenant_branches` | `KEEP` | Canonical branch / location table for multi-location tenants | `id`, `organization_id`, `name`, `address`, `city`, `country`, `latitude`, `longitude`, `phone`, `created_at`, `updated_at` | `organization_id -> organizations.id`; `users.branch_id`, `bookings.branch_id` reference it | Indexes already exist on `organization_id`, `city`; add soft archive via `status` or `archived_at` before destructive deletes |
| `users` | `MERGE` | Authn/authz identity root | Current live base: `id`, `organization_id`, `role`, `email`, `password_hash`, `locked_until`, `failed_attempts`, `created_at`; active management code also expects `branch_id`, `first_name`, `last_name`, `name`, `phone`, `profile_image_url`, `status`, `email_verified`, `phone_verified`, `last_login_at`, `updated_at`, `role_id` | `organization_id -> organizations.id`, `branch_id -> tenant_branches.id`, `role_id -> roles.id` once managed RBAC cutover is complete | Current repo has fallback legacy-role mode. Target must keep one source of truth: `users.role_id` plus derived role name, not both `role` and `role_id`. Indexes needed on `lower(email)`, `(organization_id, status)`, `role_id`, `locked_until`. Password history and login attempts are retained separately |
| `roles` | `ADD` | Managed RBAC role catalog used by platform routes and `userManagementRepository` | `id`, `organization_id nullable`, `name`, `description`, `is_system`, `created_at`, `updated_at` | `organization_id -> organizations.id` nullable for global/system roles | Required by active code; unique `(organization_id, lower(name))` and partial unique for system roles; audit create/update/delete |
| `permissions` | `ADD` | Permission catalog used by platform role APIs | `id`, `name`, `module`, `action`, optional `description`, `created_at`, `updated_at` | Global table; linked through `role_permissions` | Active code expects `module` and `action`, not `resource`; unique `(module, action)`; immutable seedable catalog with audit on changes |
| `role_permissions` | `ADD` | Many-to-many RBAC grants | `role_id`, `permission_id`, optional `granted_at`, `granted_by` | `role_id -> roles.id`, `permission_id -> permissions.id`, `granted_by -> users.id` | Unique `(role_id, permission_id)`; no soft delete; retain indefinitely for auditability |
| `user_role_assignments` | `DROP` | Prompt asked to evaluate this separately, but current repo is single-role via `users.role_id` | Not needed in current repo | Current code never queries it | Do not add until the repo contains true multi-role semantics |
| `user_invitations` | `ADD` | Pending user onboarding for platform admin flows | `id`, `organization_id`, `email`, `role_id`, `custom_message`, `status`, `invited_by`, `invited_at`, `accepted_at`, `updated_at` | `organization_id -> organizations.id`, `role_id -> roles.id`, `invited_by -> users.id` | Statuses implied by active code: `pending`, `cancelled`, plus `accepted` when backend is completed; index on `(organization_id, status, invited_at desc)`; retain after acceptance |
| `login_sessions` | `KEEP` | JWT session lifecycle, revocation, last activity | `id`, `user_id`, `organization_id`, `token_jti`, `issued_at`, `expires_at`, `last_activity_at`, `revoked_at`, `revoke_reason`, `ip_address`, `user_agent`, `created_at` | `user_id -> users.id`, `organization_id -> organizations.id` | Already indexed by user, JTI, expiry, revoked state; purge expired/revoked rows by retention policy, keep audit snapshot in `audit_logs` |
| `login_attempts` | `KEEP` | Brute-force and auth abuse tracking | `id`, `user_id`, `organization_id`, `identifier`, `ip_address`, `user_agent`, `attempt_time`, `success`, `reason` | `user_id -> users.id`, `organization_id -> organizations.id` | Already indexed by identifier/time; retain for security window, then archive or purge per policy |
| `password_history` | `KEEP` | Password reuse prevention | `id`, `user_id`, `hash`, `salt`, `created_at` | `user_id -> users.id` | Immutable security table; retain according to password policy |
| `connected_accounts` | `ADD` | External auth/account linkage expected by `userManagementRepository` | `id`, `user_id`, `provider`, `external_id`, `created_at` | `user_id -> users.id` | Unique `(provider, external_id)`; audit connect/disconnect; retain even after disconnect with `disconnected_at` if added |
| `audit_logs` | `KEEP` | Cross-platform governance log | `id`, `organization_id`, `actor_id`, `action`, `metadata`, `ip_address`, `user_agent`, `action_details`, `session_id`, `created_at` | `organization_id -> organizations.id`, `actor_id -> users.id`, `session_id -> login_sessions.id` | Already heavily used; index `(organization_id, created_at desc)`, `(actor_id, action)`; immutable and retained long-term |
| `feature_flags` | `ADD` | Persisted platform feature governance; currently platform route uses hardcoded runtime constants only | `id`, `key`, `scope`, `organization_id nullable`, `enabled`, `source`, `description`, `created_at`, `updated_at` | `organization_id -> organizations.id` when scoped | Grounded by `backend/src/modules/platform/routes.ts` and frontend feature-flag page; unique `(scope, organization_id, key)`; audit all flips |
| `organization_ai_settings` | `KEEP` | Tenant AI settings | `organization_id`, `enable_anomalies`, `enable_auto_assignment`, `anomaly_sensitivity`, `similarity_cutoff`, `updated_at` | `organization_id -> organizations.id` | Primary-key by org; audit updates; no soft delete |
| `payment_configurations` | `ADD` | Gateway enablement/config expected by `paymentsRepository` | `organization_id`, `stripe_enabled`, `paypal_enabled`, `flutterwave_enabled`, `paystack_enabled`, `updated_at` | `organization_id -> organizations.id` | Required if repository-backed gateway settings are kept; unique by org |

### 2. Tenant Operations: Clients, Staff, Services, Bookings, Reviews

| Entity | Status | Purpose / ownership domain | Key fields | Foreign keys and scope | States / indexes / audit / retention |
| --- | --- | --- | --- | --- | --- |
| `staff_members` | `MERGE` | Canonical staff directory and operational profile | Union of live expectations: `id`, `organization_id`, `user_id`, `full_name`, `email`, `phone`, `role`, `specializations`, `qualifications`, `bio`, `profile_photo_url/photo_url`, `hourly_rate`, `commission_percentage`, `status`, `is_active`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `user_id -> users.id` | `027_staff_module.sql` drops and recreates earlier staff table, causing drift. Keep one table only; status enum should include `active, inactive, on_leave, archived`; indexes on `(organization_id, status)`, `(organization_id, role)`, `(organization_id, lower(email))` |
| `staff_skills` | `KEEP` | Staff skills and certifications | `id`, `staff_member_id`, `skill_name`, `proficiency_level`, `certified_at`, `expires_at`, `created_at` | `staff_member_id -> staff_members.id` | Retain expired cert history; index by member and proficiency |
| `staff_service_assignments` | `KEEP` | Which staff can perform which services | `id`, `staff_member_id`, `service_id`, availability and supervision fields, `created_at` | `staff_member_id -> staff_members.id`, `service_id -> services.id` | Unique `(staff_member_id, service_id)` |
| `staff_verifications` | `DEFER` | Prompt requires verified staff architecture, but repo has no concrete route/model/table | No safe exact contract in repo | None safely grounded | Do not add until verification workflow source exists |
| `clients` | `KEEP` | Canonical customer / patient-facing person record | `id`, `organization_id`, `email`, `full_name`, `phone`, `preferred_staff_id`, `loyalty_points`, `membership_tier`, `telehealth_consent`, `preferences`, `risk_score`, `photo_url`, `rank_id`, `stripe_customer_id`, `lifetime_value`, `visit_count`, `no_show_count`, `last_visit_date`, `avg_spend`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `preferred_staff_id -> staff_members.id`, `rank_id -> customer_ranks.id` | Unique `(organization_id, lower(email))`; indexes on `(organization_id, created_at)`, `(organization_id, risk_score)`, `rank_id`; keep soft delete via `status` or `archived_at` if later added |
| `customers` | `DROP` | Duplicate customer table from `011_crm_core.sql` | Overlaps `clients` | Same concept as `clients` | Migrate any data to `clients`, then delete |
| `patients` | `KEEP` | Patient profile extension over `clients` for clinical workflows | `id`, `organization_id`, `customer_id`, `patient_number`, clinical history fields, insurance fields, emergency contact, `created_at` | `organization_id -> organizations.id`, `customer_id -> clients.id` | Unique `patient_number`; add `updated_at`; no hard delete in healthcare domain |
| `service_categories` | `KEEP` | Service taxonomy | `id`, `slug`, `label`, `icon`, `vertical`, `created_at` | Global or provider-neutral reference table | Unique `slug`; current enum covers beauty/wellness only and will need extension before health/logistics rollout |
| `services` | `KEEP` | Core service catalog | `id`, `organization_id`, `category_id`, `name`, `description`, `duration_minutes`, `price_cents`, `currency`, `notes`, `is_active`, `slug`, `tags`, `min_price`, `max_price`, `image_url`, `search_vector`, `service_type`, `requires_vehicle`, `requires_medical_record`, `requires_inventory`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `category_id -> service_categories.id` | Indexes already exist for org/active, slug, search, category; soft delete via `is_active`; audit create/update/delete |
| `venue_profiles` | `KEEP` | Public provider listing/public storefront | `id`, `organization_id unique`, display and public address/rating/publication fields | `organization_id -> organizations.id` | Use for marketplace/public view; do not treat as separate provider root |
| `reviews` | `MERGE` | Customer review aggregate | Migration creates `body`, `is_published`, `ai_sentiment`, `is_verified`; active routes expect `content`, `media_urls`, `status`, `resolution_status` | `organization_id -> organizations.id`, `client_id -> clients.id`, `booking_id -> bookings.id`, `staff_member_id -> staff_members.id` | Keep one table only; add the live route fields explicitly, or refactor routes to migration fields. Moderation statuses implied by routes: `pending, flagged, published, removed`. Index on `(organization_id, created_at desc)` |
| `review_responses` | `ADD` | Business/KORA responses to reviews; active review routes query and insert it | `id`, `review_id`, `organization_id`, `content`, `created_by`, `is_kora_admin`, `created_at` | `review_id -> reviews.id`, `organization_id -> organizations.id`, `created_by -> users.id` | Immutable response log; index `(review_id, created_at)` |
| `promotions` | `KEEP` | Discount / campaign code rules | `id`, `organization_id`, `code`, `type`, `value`, `min_spend`, `applicable_service_ids`, `max_uses`, `uses_count`, validity fields, `is_active`, `created_at` | `organization_id -> organizations.id` | Unique `(organization_id, code)`; soft deactivate only |
| `bookings` | `MERGE` | Core service booking aggregate | Current live shape from migrations/routes: `id`, `organization_id`, `client_id`, `staff_member_id`, `service_id`, `branch_id`, `room`, `room_id`, `start_time`, `end_time`, `status`, `notes`, `checked_in_at`, `actual_start`, `actual_end`, `source`, `deposit_paid`, `cancellation_reason`, `confirmation_code`, `notifications_sent`, `workflow_instance_id`, `created_at`; active code also expects `updated_at`, `amount_cents`, `checked_out_at` | `organization_id -> organizations.id`, `client_id -> clients.id`, `staff_member_id -> staff_members.id`, `service_id -> services.id`, `branch_id -> tenant_branches.id`, `room_id -> rooms_resources.id` | Indexes already exist on org/staff/date, org/client/date, confirmation code. Keep `status` on row for fast reads; canonical history must live in workflow tables |
| `booking_staff_assignments` | `KEEP` | Staff assignment sub-workflow for a booking | `id`, `booking_id`, `staff_member_id`, `assignment_type`, `status`, `confirmation_status`, timing/rating/note fields, `assigned_at`, `confirmed_at`, `created_at`, `updated_at` | `booking_id -> bookings.id`, `staff_member_id -> staff_members.id` | This is the real assignment table. If a generic alias is needed for docs, map `booking_assignments` to this table |
| `booking_status_history` | `DROP` | Legacy compatibility concept no longer required by mounted booking workflow routes | Superseded by `workflow_transitions(entity_type='booking')` | Do not add a second history store | Keep booking lifecycle history in canonical workflow tables only |
| `booking_checkins` | `DROP` | Legacy compatibility concept no longer required by mounted booking workflow routes | Check-in is now recorded via booking row timestamps plus `workflow_transitions` metadata | Do not add a separate check-in event table unless a future grounded route truly requires it | Avoid parallel booking event stores |
| `booking_checkouts` | `DROP` | Legacy compatibility concept no longer required by mounted booking workflow routes | Checkout/completion should stay on booking row plus `workflow_transitions` until a grounded evidence table exists | Do not invent a duplicate workflow artifact | Avoid parallel booking event stores |
| `booking_waitlist` | `KEEP` | Current mounted booking waitlist table | `id`, `organization_id`, `customer_id`, `service_id`, `preferred_staff_id`, requested date/window, queue position, `status`, `notified_at`, `expires_at`, `notes`, timestamps | `organization_id -> organizations.id`, `preferred_staff_id -> staff_members.id` | Keep this and drop older `waitlist` table after migration |
| `waitlist` | `DROP` | Older waitlist table from `007_booking_engine.sql` | Duplicate of booking waitlist concept | Same concept as `booking_waitlist` | Migrate and delete |
| `customer_staff_preferences` | `KEEP` | Staff preference / avoidance for a customer | `id`, `customer_id`, `staff_member_id`, `preference_type`, `reason`, `strength`, `created_at` | `staff_member_id -> staff_members.id` and should add `customer_id -> clients.id` explicitly in final target | Unique `(customer_id, staff_member_id)` |
| `rooms_resources` | `KEEP` | Room/chair/station/equipment availability | `id`, `organization_id`, `name`, `type`, `capacity`, `is_active`, `created_at` | `organization_id -> organizations.id` | Soft deactivate only |

### 3. Finance, Billing, Subscriptions

| Entity | Status | Purpose / ownership domain | Key fields | Foreign keys and scope | States / indexes / audit / retention |
| --- | --- | --- | --- | --- | --- |
| `invoices` | `MERGE` | Tenant invoice aggregate used by active finance routes | Base table from `001_init.sql`: `id`, `organization_id`, `amount_cents`, `status`, `due_date`, `created_at`; later migration adds `tax_amount_cents`, `discount_amount_cents`, `insurance_claim_id`; active finance routes also require `client_id` | `organization_id -> organizations.id`, must add `client_id -> clients.id`, optional `insurance_claim_id -> insurance_claims.id` | Statuses in active route: `pending, paid, overdue, cancelled`; index `(organization_id, status, due_date)` already exists; immutable amount trail should live in audit log or invoice event table if later added |
| `transactions` | `KEEP` | Canonical payment ledger already used by active payment service | `id`, `organization_id`, `invoice_id`, `booking_id`, `client_id`, `stripe_payment_intent_id`, `stripe_charge_id`, `amount_cents`, `currency`, `status`, `payment_method`, `receipt_url`, `receipt_sent_at`, `metadata`, `processed_by`, `processed_at`, `stripe_payment_method_id`, `stripe_customer_id`, `promotion_id`, `discount_amount`, `tip_amount`, `failure_code`, `failure_message`, `created_at` | `organization_id -> organizations.id`, `invoice_id -> invoices.id`, `booking_id -> bookings.id`, `promotion_id -> promotions.id`, `processed_by -> users.id`; add explicit `client_id -> clients.id` in final target | Statuses from migrations: `pending, processing, succeeded, failed, refunded, partially_refunded`; indexes already exist on org/date, invoice, booking, org/status/method; immutable financial ledger, never soft delete |
| `payment_transactions` | `ADD` short-term / `DROP` long-term | Repository-backed duplicate contract expected by `paymentsRepository` and multi-gateway routes | Active code expects `id`, `organization_id`, `user_id`, `amount_cents`, `currency`, `gateway/provider`, `gateway_transaction_id/provider_transaction_id`, `status`, `metadata`, timestamps | Should reference `organization_id -> organizations.id` and user/client owner as applicable | Do not keep as second permanent ledger. Either refactor repository to `transactions` or create compatibility view and retire this table name |
| `payment_intents` | `ADD` | Repository-backed payment-intent tracking expected by `paymentsRepository` | Active code expects `id`, `organization_id`, `user_id`, `amount_cents`, `currency`, `gateway`, `gateway_intent_id`, `status`, timestamps | `organization_id -> organizations.id`; owner ambiguity in repo between `user_id` and `client_id` must be resolved | If retained, index `(organization_id, status, created_at desc)` and unique `(gateway, gateway_intent_id)` |
| `payment_methods` | `MERGE` | Stored customer payment instruments | Current live migration shape is Stripe/client scoped: `id`, `client_id`, `stripe_payment_method_id`, `type`, `brand`, `last4`, `exp_month`, `exp_year`, `is_default`, `created_at` | `client_id -> clients.id`; active repository incorrectly assumes `organization_id` and `user_id` columns | Canonical target should stay client-scoped because active payment service uses `client_id`; add org-join through `clients`, not a second duplicate table |
| `refunds` | `KEEP` | Refund lifecycle against canonical transaction ledger | `id`, `transaction_id`, `stripe_refund_id`, `amount`, `reason`, `status`, `initiated_by`, `created_at`, `updated_at` | `transaction_id -> transactions.id`, `initiated_by -> staff_members.id` | Statuses: `pending, succeeded, failed`; immutable financial history, no soft delete |
| `stripe_customers` | `KEEP` | Stripe customer linkage and metadata cache | `id`, `organization_id`, `client_id`, `user_id`, `stripe_customer_id`, `email`, `metadata`, `created_at` | `organization_id -> organizations.id`, optional `client_id -> clients.id`, `user_id -> users.id` | Unique `stripe_customer_id`; retain for audit/integration traceability |
| `subscription_plans` | `KEEP` | Tenant-configurable plan catalog for customer subscriptions | `id`, `organization_id`, `name`, `description`, `amount_cents`, `currency`, `interval`, `trial_days`, `stripe_price_id`, `features`, `is_active`, `created_at` | `organization_id -> organizations.id` | Unique plan name per tenant should be added if business rules require it; soft deactivate only |
| `subscriptions` | `MERGE` | Canonical subscription aggregate, but currently affected by severe migration drift | Competing shapes exist in `005`, `017`, and `042`; active subscription routes expect `id`, `organization_id`, `plan`, `status`, `start_date`, `end_date`, `provider_subscription_id`, `created_at`, `updated_at`; workflow engine expects `current_state`, `billing_cycle_start`, `billing_cycle_end`, `auto_renew`, `failed_payment_attempts` | `organization_id -> organizations.id`; `client_id` or `customer_id -> clients.id`; `service_id -> services.id` in `042` shape | Current `CREATE TABLE IF NOT EXISTS` chain means the final runtime shape depends on creation order and can miss later columns. Canonical target must include workflow-owned state, billing window, provider reference, and customer ownership in one table |
| `payouts` | `KEEP` | Staff/provider payout ledger | `id`, `organization_id`, `staff_id`, period fields, gross/commission/net amounts, `status`, `stripe_payout_id`, `paid_at` | `organization_id -> organizations.id`, `staff_id -> staff_members.id` | Statuses implied: `pending`, `paid`, optionally `failed`; immutable finance table |
| `tax_records` | `KEEP` | Tax filing and liability records | `id`, `organization_id`, `tax_period`, `tax_type`, `taxable_amount_cents`, `tax_rate`, `tax_amount_cents`, `status`, `filed_at`, `created_at` | `organization_id -> organizations.id` | Status lifecycle: `draft`, `filed`, plus any filing exceptions if added later |
| `insurance_claims` | `KEEP` | Healthcare payer claim lifecycle | `id`, `organization_id`, `client_id`, `booking_id`, `invoice_id`, payer fields, `status`, billed/approved/paid amounts, denial fields, `submitted_at`, `paid_at`, `notes`, `created_at` | `organization_id -> organizations.id`, optional `client_id -> clients.id`, `booking_id -> bookings.id`, `invoice_id -> invoices.id` | Statuses already defined in migration; immutable financial/clinical record, no hard delete |
| `currency_rates` | `KEEP` | Multi-currency reference rates | `id`, `base_currency`, `target_currency`, `rate`, `date`, `created_at` | Global reference table | Unique `(base_currency, target_currency, date)`; replace only by new rows, not updates where possible |
| `payment_configurations` | `ADD` | Per-tenant gateway enablement/config used by repository code | `organization_id`, gateway booleans, provider keys/secrets only if stored securely elsewhere, `updated_at` | `organization_id -> organizations.id` | If secrets are persisted, move credentials to encrypted secret store and keep only references here |

### 4. CRM, Communications, Support, Integrations

| Entity | Status | Purpose / ownership domain | Key fields | Foreign keys and scope | States / indexes / audit / retention |
| --- | --- | --- | --- | --- | --- |
| `crm_accounts` | `KEEP` | Business account/company object for B2B CRM | `id`, `organization_id`, `name`, `industry`, `size`, `website`, `created_at`, `updated_at` | `organization_id -> organizations.id` | Index on `organization_id`; soft archive instead of delete if referenced |
| `crm_contacts` | `KEEP` | CRM contact directory | `id`, `organization_id`, `account_id`, `full_name`, `email`, `phone`, `role`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `account_id -> crm_accounts.id` | Index on org and account; unique `(organization_id, lower(email))` should be considered if duplicate emails are not allowed |
| `crm_leads` | `KEEP` | Lead intake and qualification pipeline | `id`, `organization_id`, `status`, `source`, `full_name`, `email`, `phone`, `owner_id`, `score`, `notes`, `converted_contact_id`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `converted_contact_id -> crm_contacts.id`, `owner_id` should reference `users.id` or `staff_members.id` consistently | Statuses defined: `new, contacted, qualified, converted, lost`; retain history of conversion and owner changes |
| `crm_deals` | `KEEP` | Deal/opportunity pipeline | `id`, `organization_id`, `contact_id`, `account_id`, `title`, `stage`, `value_cents`, `currency`, `probability`, `close_date`, `owner_id`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `contact_id -> crm_contacts.id`, `account_id -> crm_accounts.id` | Stage taxonomy is currently free text; either formalize enum or keep reference table later |
| `crm_activities` | `KEEP` | CRM action/task log | `id`, `organization_id`, `lead_id`, `contact_id`, `deal_id`, `activity_type`, `subject`, `due_at`, `completed_at`, `owner_id`, `notes`, `created_at`, `updated_at` | `organization_id -> organizations.id`, nullable links to lead/contact/deal | Use `completed_at` as lifecycle marker; retain immutably for sales audit |
| `crm_campaigns` | `KEEP` | Canonical CRM marketing campaign table | `id`, `organization_id`, `name`, `channel`, `status`, `started_at`, `ended_at`, `budget_cents`, `created_at`, `updated_at` | `organization_id -> organizations.id` | Status default `draft`; merge old `campaigns` into this table |
| `crm_lead_tags` | `KEEP` | Tagging for leads | `lead_id`, `tag` | `lead_id -> crm_leads.id` | Immutable set-style join table |
| `leads` / `opportunities` / `lead_interactions` / `opportunity_activities` | `DROP` | Legacy CRM family still present in older module/schema | Older duplicate columns and workflows | Duplicates `crm_*` tables | Migrate any live data to canonical CRM tables and delete old route/module wiring |
| `notification_templates` | `KEEP` | Per-tenant messaging templates | `id`, `organization_id`, `event`, `channel`, `subject`, `body`, `is_active`, `created_at`, `updated_at` | `organization_id -> organizations.id` | Unique `(organization_id, event, channel)`; keep audit of template updates |
| `notification_log` | `KEEP` | Outbound notification delivery log | `id`, `organization_id`, `client_id`, `channel`, `event`, `recipient`, `status`, `provider_id`, `sent_at`, `error`, `payload`, `created_at` | `organization_id -> organizations.id`, optional `client_id -> clients.id` | Statuses: `queued, sent, delivered, failed`; immutable delivery log; do not overload as support ticket system |
| `notifications` | `DROP` | Legacy generic table from `001_init.sql` | `id`, `organization_id`, `channel`, `payload`, `status`, `created_at` | Duplicate of `notification_log` for current platform use | Migrate if any data exists, then remove |
| `campaigns` | `DROP` | Legacy communications campaign table from `010_communications.sql` | `id`, `organization_id`, `name`, `channel`, `subject`, `body`, `audience`, `send_at`, `status`, counts, `created_by`, timestamps | Duplicate of `crm_campaigns` | Merge into `crm_campaigns`; delete once routes are cut over |
| `support_tickets` | `ADD` | Canonical support case aggregate required by active frontend `/api/support/*` contract | Real mounted shape now uses `id`, `organization_id`, optional `client_id`, optional `customer_name`, `channel`, `event`, `description`, `status`, `priority`, `assignee_staff_id`, `resolution_note`, `created_at`, `updated_at`, `resolved_at`, `closed_at` | `organization_id -> organizations.id`, `client_id -> clients.id`, `assignee_staff_id -> staff_members.id` | Statuses grounded by mounted support routes: `open, assigned, in_progress, resolved, closed, escalated`; indexes on `(organization_id, status, priority, created_at desc)` and assignee |
| `support_ticket_events` | `ADD` | Immutable ticket history required for assignee/status/resolution changes | Real mounted shape now uses `id`, `organization_id`, `support_ticket_id`, `event_type`, `actor_user_id`, `details jsonb`, `created_at` | `organization_id -> organizations.id`, `support_ticket_id -> support_tickets.id`, `actor_user_id -> users.id` | Immutable event log; no soft delete; retain indefinitely for customer support audit |
| `social_connections` | `ADD` | Tenant-scoped provider credentials for Meta social integrations | Active code expects `org_id`, `platform`, `account_id`, `account_name`, `access_token`, `is_active`, `connected_at`, likely `connected_by` | Should normalize to `organization_id` instead of `org_id`; link `connected_by -> users.id` | Access tokens are secrets; encrypt at rest or move to secret store; index `(organization_id, platform, account_id)` |
| `social_posts` | `ADD` | Tenant social publishing queue | Active routes expect `id`, `org_id`, `content`, `platforms`, `media_urls`, `status`, `scheduled_at`, `published_at`, `created_by`, `created_at` | `created_by -> users.id`; normalize `org_id -> organization_id` | Statuses observed: `draft, scheduled, published, pending_approval`; index `(organization_id, status, scheduled_at)` |
| `instagram_scheduled_media` | `ADD` | Scheduled Instagram media jobs | Active service expects `org_id`, `account_id`, `media_id`, `media_urls`, `caption`, `scheduled_at`, `status`, `created_at` | `account_id` should point to `social_connections.account_id` for Instagram records | Index `(organization_id, scheduled_at, status)` |
| `facebook_scheduled_posts` | `ADD` | Scheduled Facebook publishing jobs | Active service expects `org_id`, `page_id`, `facebook_post_id`, `message`, `media_urls`, `scheduled_at`, `status`, `created_at` | `page_id` should map to `social_connections.account_id` for Facebook records | Index `(organization_id, scheduled_at, status)` |
| `integrations` generic table | `DEFER` | Prompt asked for provider credentials/integrations broadly, but repo only provides concrete payment/social integration contracts above | No grounded universal schema | None safely grounded | Do not invent a generic integrator table yet |

### 5. Inventory, Delivery, Clinical, Emergency, AI, Workflow

| Entity | Status | Purpose / ownership domain | Key fields | Foreign keys and scope | States / indexes / audit / retention |
| --- | --- | --- | --- | --- | --- |
| `inventory_categories_v2` | `KEEP` | Canonical inventory category taxonomy for active inventory module | `id`, `organization_id`, `name`, `description`, `created_at`, `updated_at` | `organization_id -> organizations.id` | Index on org; soft archive if needed |
| `inventory_items_v2` | `KEEP` | Canonical inventory item master used by mounted inventory routes | `id`, `organization_id`, `category_id`, `warehouse_id`, `sku`, `name`, `description`, `uom`, `cost_price_cents`, `sell_price_cents`, `reorder_threshold`, `track_batches`, `is_active`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `category_id -> inventory_categories_v2.id`, `warehouse_id -> warehouses.id` | Unique `(organization_id, sku)`; use `is_active` for soft retirement |
| `stock_batches_v2` | `KEEP` | Batch/lot/expiry inventory tracking | `id`, `organization_id`, `item_id`, `warehouse_id`, `lot_number`, `expiry_date`, `quantity`, `reserved_quantity`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `item_id -> inventory_items_v2.id`, `warehouse_id -> warehouses.id` | Index on item/org/warehouse; no hard delete if financial or clinical stock is involved |
| `inventory_movements_v2` | `KEEP` | Immutable stock movement ledger | `id`, `organization_id`, `item_id`, `warehouse_id`, `batch_id`, `movement_type`, `quantity`, `reference_type`, `reference_id`, `reason`, `created_by`, `created_at` | `organization_id -> organizations.id`, `item_id -> inventory_items_v2.id`, `batch_id -> stock_batches_v2.id` | Movement types: `in, out, adjust`; immutable ledger, never soft delete |
| `inventory_reservations_v2` | `KEEP` | Stock reservation workflow | `id`, `organization_id`, `item_id`, `batch_id`, `quantity`, `status`, `reference_type`, `reference_id`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `item_id -> inventory_items_v2.id`, `batch_id -> stock_batches_v2.id` | Statuses: `pending, committed, released, canceled`; index on reference tuple |
| `suppliers_v2` | `KEEP` | Supplier master | `id`, `organization_id`, `name`, `contact`, `is_active`, `created_at`, `updated_at` | `organization_id -> organizations.id` | Soft deactivate only |
| `purchase_orders_v2` | `KEEP` | Purchase-order aggregate | `id`, `organization_id`, `supplier_id`, `status`, `expected_date`, `notes`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `supplier_id -> suppliers_v2.id` | Statuses: `draft, submitted, received, canceled`; immutable line history through child rows |
| `purchase_order_lines_v2` | `KEEP` | Purchase-order lines | `id`, `organization_id`, `purchase_order_id`, `item_id`, `quantity`, `cost_price_cents`, `received_quantity`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `purchase_order_id -> purchase_orders_v2.id`, `item_id -> inventory_items_v2.id` | No soft delete after receipt |
| `reorder_rules_v2` | `KEEP` | Automated reorder policy | `id`, `organization_id`, `item_id`, `min_quantity`, `reorder_quantity`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `item_id -> inventory_items_v2.id` | Unique `(organization_id, item_id)` |
| `products` / `stock_levels` / legacy inventory family | `DROP` | Legacy inventory schema from `013_inventory.sql` and old module | Duplicate of v2 inventory domain | Same concepts replaced by v2 tables | Migrate active data to v2 and remove old module/routes |
| `delivery_agents` | `KEEP` | Delivery workforce directory | `id`, `organization_id`, `full_name`, `phone`, `status`, `created_at`, `updated_at` | `organization_id -> organizations.id` | Statuses: `active, inactive, off_duty`; index by org |
| `delivery_vehicles` | `KEEP` | Delivery fleet | `id`, `organization_id`, `plate`, `vehicle_type`, `capacity`, `status`, `created_at`, `updated_at` | `organization_id -> organizations.id` | Statuses: `active, maintenance, inactive` |
| `delivery_zones` | `KEEP` | Geo/operating zones | `id`, `organization_id`, `name`, `geo`, `status`, `created_at`, `updated_at` | `organization_id -> organizations.id` | Statuses: `active, inactive`; no hard delete if referenced by pricing rules |
| `delivery_bookings` | `KEEP` | Delivery/dispatch booking aggregate | `id`, `organization_id`, `customer_name`, `customer_phone`, `pickup_address`, `dropoff_address`, `pickup_at`, `dropoff_at`, `price_cents`, `currency`, `status`, `related_booking_id`, `created_at`, `updated_at` | `organization_id -> organizations.id`; `related_booking_id` should reference `bookings.id` in final target | Statuses defined: `pending, assigned, pickup_en_route, picked_up, in_transit, delivered, failed, canceled`; current state on row plus immutable history in `delivery_status_history` |
| `delivery_stops` | `KEEP` | Multi-stop routing child table | `id`, `organization_id`, `delivery_booking_id`, `sequence`, `stop_type`, `address`, windows, `status`, `completed_at`, `notes`, timestamps | `organization_id -> organizations.id`, `delivery_booking_id -> delivery_bookings.id` | `stop_type` enum: `pickup, dropoff`; retain stop audit history |
| `delivery_assignments` | `KEEP` | Agent/vehicle assignment workflow | `id`, `organization_id`, `delivery_booking_id`, `agent_id`, `vehicle_id`, `status`, `assigned_at`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `delivery_booking_id -> delivery_bookings.id`, `agent_id -> delivery_agents.id`, `vehicle_id -> delivery_vehicles.id` | Statuses: `assigned, accepted, rejected, in_progress, completed, canceled`; immutable changes should also be mirrored to history/event log |
| `delivery_status_history` | `KEEP` | Immutable delivery lifecycle history | `id`, `organization_id`, `delivery_booking_id`, `status`, `occurred_at`, `notes` | `organization_id -> organizations.id`, `delivery_booking_id -> delivery_bookings.id` | Immutable event log; no soft delete |
| `proof_of_delivery` | `KEEP` | Delivery completion evidence | `id`, `organization_id`, `delivery_booking_id`, `collected_by`, `signature_url`, `photo_url`, `notes`, `recorded_at` | `organization_id -> organizations.id`, `delivery_booking_id -> delivery_bookings.id` | Immutable evidence table |
| `delivery_pricing_rules` | `KEEP` | Delivery pricing policy | `id`, `organization_id`, `zone_id`, `base_fee_cents`, `per_km_cents`, `per_minute_cents`, `active`, `created_at`, `updated_at` | `organization_id -> organizations.id`, `zone_id -> delivery_zones.id` | Soft deactivate only |
| `patients` | `KEEP` | Canonical patient profile extension; this is the real `patient_profiles` table for current repo | `id`, `organization_id`, `customer_id`, `patient_number`, blood and history fields, insurance fields, emergency contact, `created_at` | `organization_id -> organizations.id`, `customer_id -> clients.id` | Unique `patient_number`; add `updated_at`; retain indefinitely |
| `clinical_appointments` | `KEEP` | Consultation/visit aggregate | `id`, `organization_id`, `patient_id`, `booking_id`, `appointment_type`, `chief_complaint`, `diagnosis_codes`, `status`, `created_at` | `organization_id -> organizations.id`, `patient_id -> patients.id`, `booking_id -> bookings.id` | Current free-text status defaults to `scheduled`; should be normalized to workflow or checked enum before production hardening |
| `clinical_notes` | `KEEP` | SOAP/clinical notes | `id`, `appointment_id`, `organization_id`, `author_id`, `subjective`, `objective`, `assessment`, `plan`, `ai_draft`, `ai_draft_accepted`, `created_at` | `appointment_id -> clinical_appointments.id`, `organization_id -> organizations.id`, `author_id -> staff_members.id` | Immutable clinical record entries; never soft delete |
| `lab_orders` | `KEEP` | Lab workflow order header | `id`, `organization_id`, `patient_id`, `appointment_id`, `test_names`, `status`, `ordered_by`, `ordered_at` | `organization_id -> organizations.id`, `patient_id -> patients.id`, `appointment_id -> clinical_appointments.id`, `ordered_by -> staff_members.id` | Status defaults `ordered`; formal lifecycle should be enumerated later only if grounded by routes |
| `lab_results` | `KEEP` | Lab result rows | `id`, `lab_order_id`, `test_name`, `value`, `unit`, `reference_range`, `flag`, `resulted_at` | `lab_order_id -> lab_orders.id` | Immutable results, no soft delete |
| `prescriptions` | `KEEP` | Medication prescription records | `id`, `organization_id`, `patient_id`, `appointment_id`, `prescribed_by`, `medication`, `dosage`, `frequency`, `duration`, `notes`, `prescribed_at` | `organization_id -> organizations.id`, `patient_id -> patients.id`, `appointment_id -> clinical_appointments.id`, `prescribed_by -> staff_members.id` | Immutable medical record |
| `diagnoses` | `KEEP` | Structured diagnosis records | `id`, `appointment_id`, `patient_id`, `diagnosis_code`, `description`, `diagnosed_at` | `appointment_id -> clinical_appointments.id`, `patient_id -> patients.id` | Immutable medical record |
| `emergency_requests` | `KEEP` | Emergency intake aggregate | `id`, `organization_id`, `customer_id`, `request_type`, location fields, `address`, `severity`, `caller_name`, `caller_phone`, `status`, `assigned_unit_id`, `response_time_seconds`, `notes`, `created_at`, `resolved_at` | `organization_id -> organizations.id`, `customer_id -> clients.id`; final target should add FK `assigned_unit_id -> dispatch_units.id` | Statuses: `open, dispatched, en_route, on_scene, resolved, cancelled`; current state on row, immutable timing/logging in child tables |
| `dispatch_units` | `KEEP` | Emergency unit resource table; this is the repo's actual `emergency_units` table | `id`, `organization_id`, `unit_name`, `unit_type`, `staff_id`, `vehicle_id`, current location, `status`, `last_updated` | `organization_id -> organizations.id`, `staff_id -> staff_members.id` | Availability statuses are currently free text; normalize only when route contract exists |
| `incident_reports` | `KEEP` | Emergency incident log; this is the repo's actual `emergency_incidents` table | `id`, `organization_id`, `emergency_request_id`, `report_type`, `description`, `actions_taken`, `outcome`, `reported_by`, `created_at` | `organization_id -> organizations.id`, `emergency_request_id -> emergency_requests.id`, `reported_by -> staff_members.id` | Immutable incident record |
| `response_times` | `KEEP` | Emergency response timing metrics | `id`, `organization_id`, `emergency_request_id`, `dispatch_unit_id`, `dispatched_at`, `arrived_at`, `resolved_at`, generated `response_seconds` | `organization_id -> organizations.id`, `emergency_request_id -> emergency_requests.id`, `dispatch_unit_id -> dispatch_units.id` | Immutable SLA table |
| `incidents` | `DROP` | Legacy generic incident table from `001_init.sql` | `id`, `organization_id`, `severity`, `description`, `status`, `created_at` | Duplicate/underspecified versus emergency domain | Migrate or delete depending on data |
| `ai_requests` | `KEEP` | Raw AI request telemetry | `id`, `organization_id`, `model`, token fields, `latency_ms`, `provider`, `user_id`, `total_tokens`, `cost_usd`, `inference_type`, `metadata`, `created_at` | `organization_id -> organizations.id`, `user_id -> users.id` | Immutable telemetry; retain per cost/compliance policy |
| `ai_usage_logs` | `KEEP` | Monetized AI usage ledger | `id`, `organization_id`, `user_id`, `action_type`, `tokens`, `cost`, `created_at` | `organization_id -> organizations.id`, `user_id -> users.id` | Immutable cost ledger; index org/action |
| `ai_decision_logs` | `KEEP` | Explainability/audit trail of AI decisions | `id`, `organization_id`, `action`, `input_summary`, `output`, `score`, `reason`, `created_at` | `organization_id -> organizations.id` | Immutable and long-retained |
| `ai_insights` | `KEEP` | Stored AI insights; this is the closest grounded table to narrative `ai_recommendations` | `id`, `organization_id`, `insight_type`, `content`, `confidence_score`, `generated_by`, `expires_at`, `created_at`, `updated_at` | `organization_id -> organizations.id` | Soft expiry via `expires_at`; do not delete active records prematurely |
| `ai_predictions` | `KEEP` | Predicted operational metrics | `id`, `organization_id`, `metric_name`, predicted and actual values, window fields, `created_at`, `validated_at` | `organization_id -> organizations.id` | Immutable prediction snapshots with optional validation |
| `anomaly_baselines` | `KEEP` | Baselines for anomaly detection | `id`, `organization_id`, `metric_name`, `baseline_value`, `std_dev`, `z_score_threshold`, `last_updated` | `organization_id -> organizations.id` | Unique `(organization_id, metric_name)` |
| `anomaly_events` | `KEEP` | Actual anomaly log; this is the grounded `anomalies` table | `id`, `organization_id`, `metric_name`, `current_value`, `expected_range`, `explanation_text`, `severity`, `created_at` | `organization_id -> organizations.id` | Immutable anomaly event stream |
| `ai_budgets` | `KEEP` | AI budget governance | `id`, `organization_id`, monthly limit/spend fields, `reset_date`, timestamps | `organization_id -> organizations.id` | Unique by org |
| `ai_command_candidates` | `KEEP` | AI operational action queue; this is the grounded action-recommendation table | `id`, `organization_id`, `source_module`, `title`, `context`, `severity`, `dependencies`, `sla_risk`, `command_fingerprint`, `metadata`, `status`, `detected_at` | `organization_id -> organizations.id` | Status currently defaults to `open`; index on org/detected and fingerprint |
| `ai_action_feedback` | `KEEP` | Outcome feedback for AI recommendations | `id`, `organization_id`, `user_id`, `action_id`, `command_fingerprint`, `outcome`, `feedback_score`, `notes`, `created_at` | `organization_id -> organizations.id`, `user_id -> users.id` | Outcomes: `accepted, rejected, executed, ignored`; immutable |
| `ai_orchestration_events` | `KEEP` | AI orchestration snapshots and policy outcomes | `id`, `organization_id`, `user_id`, `context`, `snapshot`, `prioritized_actions`, `policy_outcomes`, `created_at` | `organization_id -> organizations.id`, `user_id -> users.id` | Immutable event log |
| `workflow_states` | `KEEP` | Canonical current workflow state table for all aggregates | `id`, `organization_id`, `entity_type`, `entity_id`, `current_state`, `created_at`, `updated_at` | `organization_id -> organizations.id` | Unique `(entity_type, entity_id)`; current-state source of truth |
| `workflow_transitions` | `MERGE` | Canonical immutable workflow history | Current post-043 target: `id`, `organization_id`, `entity_type`, `entity_id`, `from_state`, `to_state`, `triggered_by`, `reason`, `metadata`, `created_at`; older `025` version also carried `workflow_instance_id` | `organization_id -> organizations.id`; if old `workflow_instance_id` remains during migration it must become nullable only | Use this as canonical history for bookings, subscriptions, and any future workflowized aggregate |
| `workflow_definitions` | `KEEP` | Platform-wide workflow definitions | `id`, `entity_type`, `name`, `description`, `initial_state`, `terminal_states`, `transitions`, `created_at` | Global table | Keep while workflow engine uses defined state maps |
| `workflow_instances` | `DROP` after cutover | Legacy business-scoped current-state table from `025` | `id`, `business_id`, `entity_type`, `entity_id`, `workflow_definition_id`, state fields, timestamps | `business_id -> businesses.id` | `043` makes `workflow_states` the source of truth. Migrate then delete |

### 6. Required Missing Contracts Before Production Cutover

- `roles`, `permissions`, `role_permissions`, `user_invitations`, and `connected_accounts` are required because mounted platform/admin repositories already read and write them.
- `support_tickets` and `support_ticket_events` are now required and grounded directly by mounted `/api/support/*` routes.
- `review_responses` is required because the mounted reviews module already queries and inserts it.
- `payment_intents`, `payment_transactions`, and `payment_configurations` are missing from migrations but are queried by repository code. Prefer refactor to canonical `transactions` where possible instead of introducing a permanent second ledger.
- `booking_checkins`, `booking_checkouts`, and `booking_status_history` are no longer required by the mounted booking workflow routes because the route has been refactored to use `workflow_transitions` directly.
- `social_connections`, `social_posts`, `instagram_scheduled_media`, and `facebook_scheduled_posts` are required because mounted social routes and services already insert into them.
- `users` must be expanded to match active management code, and `organizations` must gain `industry`, `status`, and `updated_at` because active tenant/platform modules query those columns now.
- `invoices.client_id` is required because active finance routes join invoices back to clients but the migration chain does not define that column.

### 7. Deferred Or Unsupported Requested Entities

| Requested concept | Repo-grounded conclusion |
| --- | --- |
| `service_providers` separate from `organizations` | `DEFER`. Current repo treats `organizations` as tenant root and `venue_profiles` as public provider extension. No second provider-root contract should be invented |
| `provider_verifications` | `DEFER`. No concrete schema, route, or test contract in repo |
| `staff_verifications` | `DEFER`. No concrete schema, route, or test contract in repo |
| `blog_posts`, `blog_categories`, `blog_comments`, moderation queue | `DEFER`. Frontend navigation mentions content governance, but there is no backend content module or migration-backed schema |
| Generic `settings` blob table | `DEFER`. Repo contains concrete settings tables instead: `organization_ai_settings`, `payment_configurations`, `notification_templates` |
| Generic `webhooks` / `outbox` / `event_logs` table | `DEFER`. Repo uses domain-specific logs (`notification_log`, `workflow_transitions`, `audit_logs`, `ai_orchestration_events`) rather than a generic outbox |

## State-Bearing Tables And Canonical Lifecycle History

| Aggregate | Current-state table | Canonical history table | Notes |
| --- | --- | --- | --- |
| `bookings` | `bookings.status` plus `workflow_states(entity_type='booking')` | `workflow_transitions(entity_type='booking')`; short-term compatibility may require `booking_status_history` | End state should remove duplicate state history and rely on workflow tables |
| `subscriptions` | `workflow_states(entity_type='subscription')` plus subscription billing dates on `subscriptions` | `workflow_transitions(entity_type='subscription')` | `subscriptions.current_state` from `042` is redundant once workflow tables are authoritative, but may remain as compatibility column during cutover |
| `support_tickets` | `support_tickets.status` | `support_ticket_events` | Must exist because support is an operational workflow, not just a list view |
| `emergency_requests` | `emergency_requests.status` | `incident_reports` plus `response_times`; optionally add explicit request event log later only if repo grows one | Current repo has enough for incident logging and SLA timing without inventing a generic second history table |
| `delivery_bookings` | `delivery_bookings.status` | `delivery_status_history` | Keep both |
| `users` / onboarding | `users.status`, `users.locked_until`, `users.email_verified`, `users.phone_verified` | `audit_logs`, `login_attempts`, `user_invitations`, `password_history`, `login_sessions` | Do not add separate verification history table until the repo contains it |
| `staff_members` | `staff_members.status` / `is_active` | `audit_logs`; later dedicated staff verification history only if productized | Current repo lacks a concrete verification event table |
| `payments` | `transactions.status` | `refunds` for reversals plus `audit_logs` | Financial ledger rows are themselves immutable evidence |
| `incident_reports` | n/a | table is already immutable history | This is history-first by design |
| Content/blog moderation | `DEFER` | `DEFER` | No repo-grounded schema exists yet |

## Multi-Tenant Isolation Rules

### Organization-scoped tables where `organization_id` is mandatory

- Tenant root and governance: `tenant_branches`, `users`, `roles`, `user_invitations`, `login_sessions`, `login_attempts`, `audit_logs`, `feature_flags`, `organization_ai_settings`, `payment_configurations`
- Operations: `staff_members`, `clients`, `patients`, `services`, `venue_profiles`, `reviews`, `promotions`, `bookings`, `booking_staff_assignments`, `booking_checkins`, `booking_checkouts`, `booking_waitlist`, `rooms_resources`
- Finance: `invoices`, `transactions`, `payment_transactions` if temporarily retained, `payment_intents`, `stripe_customers`, `subscription_plans`, `subscriptions`, `payouts`, `tax_records`, `insurance_claims`
- CRM and communications: `crm_accounts`, `crm_contacts`, `crm_leads`, `crm_deals`, `crm_activities`, `crm_campaigns`, `notification_templates`, `notification_log`, `support_tickets`, `support_ticket_events`, `social_connections`, `social_posts`, `instagram_scheduled_media`, `facebook_scheduled_posts`
- Inventory and logistics: `inventory_categories_v2`, `inventory_items_v2`, `stock_batches_v2`, `inventory_movements_v2`, `inventory_reservations_v2`, `suppliers_v2`, `purchase_orders_v2`, `purchase_order_lines_v2`, `reorder_rules_v2`, `delivery_agents`, `delivery_vehicles`, `delivery_zones`, `delivery_bookings`, `delivery_stops`, `delivery_assignments`, `delivery_status_history`, `proof_of_delivery`, `delivery_pricing_rules`
- Clinical and emergency: `clinical_appointments`, `clinical_notes`, `lab_orders`, `prescriptions`, `emergency_requests`, `dispatch_units`, `incident_reports`, `response_times`
- AI and workflow: `ai_requests`, `ai_usage_logs`, `ai_decision_logs`, `ai_insights`, `ai_predictions`, `anomaly_baselines`, `anomaly_events`, `ai_budgets`, `ai_command_candidates`, `ai_action_feedback`, `ai_orchestration_events`, `workflow_states`, `workflow_transitions`

### Tables that also require location or branch scope

- `users.branch_id` should point to `tenant_branches.id` for branch-restricted staff access.
- `bookings.branch_id` is required for branch-aware operations.
- Inventory should remain warehouse-aware through `warehouse_id`; if warehouses are branch-bound, enforce branch-to-warehouse mapping rather than copying `branch_id` onto every row.
- Delivery and emergency may need branch/location derivation from zone/unit/booking, but the repo does not currently provide a universal `location_id` contract for those tables.

### Tables with end-user or customer ownership

- `clients` is the customer root inside a tenant.
- `patients.customer_id`, `invoices.client_id`, `transactions.client_id`, `subscriptions.client_id`, `support_tickets.customer_id`, `reviews.client_id`, and `bookings.client_id` are tenant-internal customer links and must always be constrained by the same `organization_id`.
- `payment_methods.client_id` is customer-owned, not platform-global.

### Tenant isolation enforcement

- Every repository and route must filter by `organization_id` taken from authenticated context or an explicitly validated platform-admin scope.
- Cross-tenant joins must include both child-table `organization_id` and parent-table ownership checks; do not rely on UUID equality alone.
- Any compatibility view created during migration must preserve tenant predicates and must not expose cross-tenant rows.
- Platform-admin reads may span tenants, but writes to tenant-scoped tables must always state the target `organization_id` explicitly and be audit logged.

## Migration Cleanup And Consolidation Plan

### Highest-risk schema drift to fix first

1. `subscriptions`
   - `005_payments.sql`, `017_finance_full.sql`, and `042_billing_subscriptions.sql` define incompatible shapes.
   - Because all three use `CREATE TABLE IF NOT EXISTS`, later intended columns are not guaranteed to exist.
   - Cutover plan: create a single canonical migration that normalizes `subscriptions` to the active route plus workflow contract, backfills missing columns, migrates customer references to `client_id`, and removes dependence on whichever historical shape happened to be created first.

2. `users`
   - Base migration defines only `id`, `organization_id`, `role`, `email`, `created_at`.
   - Active admin code expects managed-profile fields, verification flags, branch linkage, lock state, and `role_id`.
   - Cutover plan: additive migration to introduce the missing columns, backfill from existing data where possible, then retire the fallback `role` text-only mode after RBAC tables are live.

3. `organizations`
   - Base migration lacks `status`, `industry`, and `updated_at`, but active tenant/platform code expects them.
   - Cutover plan: additive migration plus data backfill using current business activation semantics.

4. `reviews`
   - Migration and route contract diverge (`body` vs `content`, moderation fields missing, `review_responses` absent).
   - Cutover plan: choose one canonical column set, migrate data, add missing response table, update all reads to one shape.

5. `invoices`
   - Active finance routes require `client_id`; migration chain does not provide it.
   - Cutover plan: add `client_id`, backfill from transactions or bookings where possible, then enforce FK.

### Duplicate concepts to merge

- `businesses` into `organizations`
- `customers` into `clients`
- old CRM family (`leads`, `opportunities`, `lead_interactions`, `opportunity_activities`) into `crm_leads`, `crm_deals`, `crm_activities`
- legacy communications `campaigns` into `crm_campaigns`
- old inventory family (`products`, `stock_levels`, `suppliers`, `purchase_orders`, related helpers) into v2 inventory tables
- old `waitlist` into `booking_waitlist`
- legacy workflow current-state model `workflow_instances` into `workflow_states`
- legacy generic `notifications` into `notification_log`

### Naming and foreign-key mismatches to remove

- `business_id` must be replaced by `organization_id`
- `org_id` in social tables must be replaced by `organization_id`
- `customer_id` and `client_id` must converge on `client_id` at the database level, with API aliases only at the boundary if needed
- `users.role` text and `users.role_id` cannot remain parallel long-term
- `payment_methods` cannot be both `client_id`-scoped and `user_id`/`organization_id`-scoped; current payment service shows client scope is the grounded choice

### Tables or modules to delete after migration

- `businesses`
- `customers`
- `leads`
- `opportunities`
- `lead_interactions`
- `opportunity_activities`
- `campaigns`
- `notifications`
- `waitlist`
- `workflow_instances` after workflow cutover
- `products`, `stock_levels`, and the rest of the legacy inventory family after v2 migration
- any compatibility-only `payment_transactions` or `booking_status_history` layer once services are refactored to canonical tables

## Seed And Data Cleanup Plan

- Rewrite `backend/src/db/seed.ts` to seed `organizations` as the tenant root, not `businesses`.
- Remove seed paths that still write into legacy inventory tables and replace them with v2 inventory seeds only if the active inventory module needs demo data.
- Remove seed logic that assumes obsolete schema families such as old CRM or legacy workflow tables.
- Keep only demo data that exercises mounted routes and canonical workflows: tenant, branch, users/RBAC, clients, services, staff, bookings, invoices, transactions, subscriptions, inventory v2, CRM canonical tables, delivery, clinical, emergency, notifications, AI settings.
- Any seeded support data should use the new `support_tickets` model once implemented, not `notification_log` masquerading as support.
- Seed data for healthcare and financial domains must be obviously synthetic and minimal; do not keep decorative bulk demo records that hide schema errors.
