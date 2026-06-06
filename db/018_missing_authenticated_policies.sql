-- ============================================================================
-- SECURITY FIX: Create missing authenticated policies for 18 tables
-- ============================================================================
-- These tables have RLS enabled but no policy for authenticated users
-- Adding tenant-scoped policies with write integrity
-- ============================================================================

-- Core tenant data
CREATE POLICY policy_entity_graph_isolation ON entity_graph FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_entity_relationships_isolation ON entity_relationships FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_ledger_entries_isolation ON ledger_entries FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_wallets_isolation ON wallets FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Business operations
CREATE POLICY policy_bookings_isolation ON bookings FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_products_isolation ON products FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_services_isolation ON services FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_business_profiles_isolation ON business_profiles FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Business structure
CREATE POLICY policy_franchise_tree_isolation ON franchise_tree FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_revenue_share_rules_isolation ON revenue_share_rules FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- AI & Orchestration
CREATE POLICY policy_ai_orchestrator_isolation ON ai_orchestrator FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_ai_actions_isolation ON ai_actions FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Events & Compliance
CREATE POLICY policy_event_stream_isolation ON event_stream FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_event_subscriptions_isolation ON event_subscriptions FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_compliance_rules_isolation ON compliance_rules FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_audit_control_plane_isolation ON audit_control_plane FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

-- Billing
CREATE POLICY policy_tenant_subscriptions_isolation ON tenant_subscriptions FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());

CREATE POLICY policy_usage_metering_isolation ON usage_metering FOR ALL TO authenticated 
  USING (tenant_id = kora_current_tenant_id()) 
  WITH CHECK (tenant_id = kora_current_tenant_id());
