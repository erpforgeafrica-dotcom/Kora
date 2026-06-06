-- ============================================================================
-- SECURITY FIX: Add WITH CHECK to all tenant-isolated policies
-- ============================================================================
-- This script fixes write integrity by adding WITH CHECK clauses
-- Prevents users from inserting/updating data with wrong tenant_id
-- ============================================================================

-- Drop and recreate policies with WITH CHECK for tenant-scoped tables
-- Pattern: DROP existing policy, CREATE with both USING and WITH CHECK

-- RBAC & MDM
DROP POLICY IF EXISTS policy_user_roles_isolation ON user_roles;
CREATE POLICY policy_user_roles_isolation ON user_roles FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_addresses_isolation ON addresses;
CREATE POLICY policy_addresses_isolation ON addresses FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_contacts_isolation ON contacts;
CREATE POLICY policy_contacts_isolation ON contacts FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_persons_isolation ON persons;
CREATE POLICY policy_persons_isolation ON persons FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_organizations_isolation ON organizations;
CREATE POLICY policy_organizations_isolation ON organizations FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_branches_isolation ON branches;
CREATE POLICY policy_branches_isolation ON branches FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_departments_isolation ON departments;
CREATE POLICY policy_departments_isolation ON departments FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_teams_isolation ON teams;
CREATE POLICY policy_teams_isolation ON teams FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_team_members_isolation ON team_members;
CREATE POLICY policy_team_members_isolation ON team_members FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Verification & Trust
DROP POLICY IF EXISTS policy_org_verifications_isolation ON organization_verifications;
CREATE POLICY policy_org_verifications_isolation ON organization_verifications FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_biometric_profiles_isolation ON biometric_profiles;
CREATE POLICY policy_biometric_profiles_isolation ON biometric_profiles FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_user_documents_isolation ON user_documents;
CREATE POLICY policy_user_documents_isolation ON user_documents FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_trust_scores_isolation ON trust_scores;
CREATE POLICY policy_trust_scores_isolation ON trust_scores FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- HRM
DROP POLICY IF EXISTS policy_employees_isolation ON employees;
CREATE POLICY policy_employees_isolation ON employees FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_employee_contracts_isolation ON employee_contracts;
CREATE POLICY policy_employee_contracts_isolation ON employee_contracts FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_shifts_isolation ON shifts;
CREATE POLICY policy_shifts_isolation ON shifts FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_attendance_isolation ON attendance;
CREATE POLICY policy_attendance_isolation ON attendance FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_leave_requests_isolation ON leave_requests;
CREATE POLICY policy_leave_requests_isolation ON leave_requests FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_payroll_isolation ON payroll;
CREATE POLICY policy_payroll_isolation ON payroll FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_performance_reviews_isolation ON performance_reviews;
CREATE POLICY policy_performance_reviews_isolation ON performance_reviews FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Workflow
DROP POLICY IF EXISTS policy_workflow_templates_isolation ON workflow_templates;
CREATE POLICY policy_workflow_templates_isolation ON workflow_templates FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_workflow_steps_isolation ON workflow_steps;
CREATE POLICY policy_workflow_steps_isolation ON workflow_steps FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_workflow_instances_isolation ON workflow_instances;
CREATE POLICY policy_workflow_instances_isolation ON workflow_instances FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_workflow_actions_isolation ON workflow_actions;
CREATE POLICY policy_workflow_actions_isolation ON workflow_actions FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_approval_policies_isolation ON approval_policies;
CREATE POLICY policy_approval_policies_isolation ON approval_policies FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_approval_levels_isolation ON approval_levels;
CREATE POLICY policy_approval_levels_isolation ON approval_levels FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_approval_rules_isolation ON approval_rules;
CREATE POLICY policy_approval_rules_isolation ON approval_rules FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Finance
DROP POLICY IF EXISTS policy_chart_of_accounts_isolation ON chart_of_accounts;
CREATE POLICY policy_chart_of_accounts_isolation ON chart_of_accounts FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_journal_entries_isolation ON journal_entries;
CREATE POLICY policy_journal_entries_isolation ON journal_entries FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_journal_entry_lines_isolation ON journal_entry_lines;
CREATE POLICY policy_journal_entry_lines_isolation ON journal_entry_lines FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_budgets_isolation ON budgets;
CREATE POLICY policy_budgets_isolation ON budgets FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_budget_lines_isolation ON budget_lines;
CREATE POLICY policy_budget_lines_isolation ON budget_lines FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_bank_accounts_isolation ON bank_accounts;
CREATE POLICY policy_bank_accounts_isolation ON bank_accounts FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_bank_transactions_isolation ON bank_transactions;
CREATE POLICY policy_bank_transactions_isolation ON bank_transactions FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_bank_reconciliations_isolation ON bank_reconciliations;
CREATE POLICY policy_bank_reconciliations_isolation ON bank_reconciliations FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Procurement
DROP POLICY IF EXISTS policy_vendors_isolation ON vendors;
CREATE POLICY policy_vendors_isolation ON vendors FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_purchase_requests_isolation ON purchase_requests;
CREATE POLICY policy_purchase_requests_isolation ON purchase_requests FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_purchase_request_lines_isolation ON purchase_request_lines;
CREATE POLICY policy_purchase_request_lines_isolation ON purchase_request_lines FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_rfqs_isolation ON rfqs;
CREATE POLICY policy_rfqs_isolation ON rfqs FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_vendor_quotes_isolation ON vendor_quotes;
CREATE POLICY policy_vendor_quotes_isolation ON vendor_quotes FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_purchase_orders_isolation ON purchase_orders;
CREATE POLICY policy_purchase_orders_isolation ON purchase_orders FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_purchase_order_lines_isolation ON purchase_order_lines;
CREATE POLICY policy_purchase_order_lines_isolation ON purchase_order_lines FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_grn_isolation ON goods_received_notes;
CREATE POLICY policy_grn_isolation ON goods_received_notes FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_warehouses_isolation ON warehouses;
CREATE POLICY policy_warehouses_isolation ON warehouses FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_inventory_items_isolation ON inventory_items;
CREATE POLICY policy_inventory_items_isolation ON inventory_items FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_stock_movements_isolation ON stock_movements;
CREATE POLICY policy_stock_movements_isolation ON stock_movements FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_stock_batches_isolation ON stock_batches;
CREATE POLICY policy_stock_batches_isolation ON stock_batches FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Sales & CRM
DROP POLICY IF EXISTS policy_leads_isolation ON leads;
CREATE POLICY policy_leads_isolation ON leads FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_opportunities_isolation ON opportunities;
CREATE POLICY policy_opportunities_isolation ON opportunities FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_customers_isolation ON customers;
CREATE POLICY policy_customers_isolation ON customers FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_sales_orders_isolation ON sales_orders;
CREATE POLICY policy_sales_orders_isolation ON sales_orders FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_sales_order_lines_isolation ON sales_order_lines;
CREATE POLICY policy_sales_order_lines_isolation ON sales_order_lines FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_invoices_isolation ON invoices;
CREATE POLICY policy_invoices_isolation ON invoices FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_invoice_lines_isolation ON invoice_lines;
CREATE POLICY policy_invoice_lines_isolation ON invoice_lines FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_payments_isolation ON payments;
CREATE POLICY policy_payments_isolation ON payments FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_credit_notes_isolation ON credit_notes;
CREATE POLICY policy_credit_notes_isolation ON credit_notes FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Projects
DROP POLICY IF EXISTS policy_projects_isolation ON projects;
CREATE POLICY policy_projects_isolation ON projects FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_project_members_isolation ON project_members;
CREATE POLICY policy_project_members_isolation ON project_members FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_tasks_isolation ON tasks;
CREATE POLICY policy_tasks_isolation ON tasks FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_task_assignments_isolation ON task_assignments;
CREATE POLICY policy_task_assignments_isolation ON task_assignments FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_task_dependencies_isolation ON task_dependencies;
CREATE POLICY policy_task_dependencies_isolation ON task_dependencies FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_time_entries_isolation ON time_entries;
CREATE POLICY policy_time_entries_isolation ON time_entries FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_project_expenses_isolation ON project_expenses;
CREATE POLICY policy_project_expenses_isolation ON project_expenses FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Documents
DROP POLICY IF EXISTS policy_document_categories_isolation ON document_categories;
CREATE POLICY policy_document_categories_isolation ON document_categories FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_documents_isolation ON documents;
CREATE POLICY policy_documents_isolation ON documents FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_document_versions_isolation ON document_versions;
CREATE POLICY policy_document_versions_isolation ON document_versions FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_document_permissions_isolation ON document_permissions;
CREATE POLICY policy_document_permissions_isolation ON document_permissions FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Content & Media
DROP POLICY IF EXISTS policy_content_pages_isolation ON content_pages;
CREATE POLICY policy_content_pages_isolation ON content_pages FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_media_library_isolation ON media_library;
CREATE POLICY policy_media_library_isolation ON media_library FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_translations_isolation ON translations;
CREATE POLICY policy_translations_isolation ON translations FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_notification_templates_isolation ON notification_templates;
CREATE POLICY policy_notification_templates_isolation ON notification_templates FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_email_logs_isolation ON email_logs;
CREATE POLICY policy_email_logs_isolation ON email_logs FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Subscriptions
DROP POLICY IF EXISTS policy_subscriptions_isolation ON subscriptions;
CREATE POLICY policy_subscriptions_isolation ON subscriptions FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_usage_metrics_isolation ON usage_metrics;
CREATE POLICY policy_usage_metrics_isolation ON usage_metrics FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Settings
DROP POLICY IF EXISTS policy_tenant_settings_isolation ON tenant_settings;
CREATE POLICY policy_tenant_settings_isolation ON tenant_settings FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_api_keys_isolation ON api_keys;
CREATE POLICY policy_api_keys_isolation ON api_keys FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_webhooks_isolation ON webhooks;
CREATE POLICY policy_webhooks_isolation ON webhooks FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

DROP POLICY IF EXISTS policy_integrations_isolation ON integrations;
CREATE POLICY policy_integrations_isolation ON integrations FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());
