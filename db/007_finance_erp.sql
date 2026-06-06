-- =====================================================================================
-- Migration 007: Finance ERP
-- =====================================================================================
-- Chart of Accounts, Journal Entries, Budgets, Bank Accounts, Reconciliation
-- =====================================================================================

-- =====================================================================================
-- CHART OF ACCOUNTS
-- =====================================================================================
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  account_code TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  
  account_type VARCHAR(50) NOT NULL CHECK (account_type IN (
    'asset', 'liability', 'equity', 'revenue', 'expense'
  )),
  
  account_subtype VARCHAR(100), -- e.g., 'current_asset', 'fixed_asset', 'operating_expense'
  
  parent_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  
  currency VARCHAR(3) DEFAULT 'USD',
  
  is_active BOOLEAN DEFAULT TRUE,
  is_system_account BOOLEAN DEFAULT FALSE, -- cannot be deleted
  
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chart_of_accounts_tenant ON chart_of_accounts(tenant_id);
CREATE INDEX idx_chart_of_accounts_type ON chart_of_accounts(account_type);
CREATE INDEX idx_chart_of_accounts_parent ON chart_of_accounts(parent_account_id);
CREATE INDEX idx_chart_of_accounts_code ON chart_of_accounts(account_code);

ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_chart_of_accounts_isolation ON chart_of_accounts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- JOURNAL ENTRIES
-- =====================================================================================
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  journal_number TEXT UNIQUE NOT NULL,
  journal_date DATE NOT NULL,
  
  description TEXT NOT NULL,
  reference TEXT,
  
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'posted', 'void'
  )),
  
  -- Related Document
  source_type VARCHAR(100), -- e.g., 'invoice', 'payment', 'expense', 'manual'
  source_id UUID,
  
  created_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  
  posted_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  posted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_tenant ON journal_entries(tenant_id);
CREATE INDEX idx_journal_entries_number ON journal_entries(journal_number);
CREATE INDEX idx_journal_entries_date ON journal_entries(journal_date);
CREATE INDEX idx_journal_entries_status ON journal_entries(status);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_journal_entries_isolation ON journal_entries
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- JOURNAL ENTRY LINES
-- =====================================================================================
CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  
  line_order INTEGER NOT NULL,
  
  description TEXT,
  
  debit DECIMAL(15,2) DEFAULT 0 CHECK (debit >= 0),
  credit DECIMAL(15,2) DEFAULT 0 CHECK (credit >= 0),
  
  -- Additional Dimensions
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure either debit or credit, not both
  CONSTRAINT check_debit_or_credit CHECK (
    (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
  )
);

CREATE INDEX idx_journal_entry_lines_tenant ON journal_entry_lines(tenant_id);
CREATE INDEX idx_journal_entry_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);

ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_journal_entry_lines_isolation ON journal_entry_lines
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- BUDGETS
-- =====================================================================================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  budget_name TEXT NOT NULL,
  budget_code TEXT UNIQUE NOT NULL,
  
  budget_period VARCHAR(50) CHECK (budget_period IN ('monthly', 'quarterly', 'annual')),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'active', 'closed', 'archived'
  )),
  
  description TEXT,
  
  created_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budgets_tenant ON budgets(tenant_id);
CREATE INDEX idx_budgets_period ON budgets(start_date, end_date);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_budgets_isolation ON budgets
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- BUDGET LINES
-- =====================================================================================
CREATE TABLE budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
  
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  budgeted_amount DECIMAL(15,2) NOT NULL,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_lines_tenant ON budget_lines(tenant_id);
CREATE INDEX idx_budget_lines_budget ON budget_lines(budget_id);
CREATE INDEX idx_budget_lines_account ON budget_lines(account_id);

ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_budget_lines_isolation ON budget_lines
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- BANK ACCOUNTS
-- =====================================================================================
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  
  bank_name TEXT NOT NULL,
  bank_branch TEXT,
  bank_code TEXT,
  
  swift_code TEXT,
  iban TEXT,
  
  currency VARCHAR(3) DEFAULT 'USD',
  
  gl_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_tenant ON bank_accounts(tenant_id);
CREATE INDEX idx_bank_accounts_number ON bank_accounts(account_number);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_bank_accounts_isolation ON bank_accounts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- BANK TRANSACTIONS
-- =====================================================================================
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(50) CHECK (transaction_type IN ('debit', 'credit')),
  
  amount DECIMAL(15,2) NOT NULL,
  
  description TEXT,
  reference TEXT,
  
  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMPTZ,
  reconciled_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  
  matched_journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_transactions_tenant ON bank_transactions(tenant_id);
CREATE INDEX idx_bank_transactions_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_transactions_reconciled ON bank_transactions(is_reconciled);

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_bank_transactions_isolation ON bank_transactions
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- BANK RECONCILIATION
-- =====================================================================================
CREATE TABLE bank_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  
  reconciliation_date DATE NOT NULL,
  
  opening_balance DECIMAL(15,2) NOT NULL,
  closing_balance DECIMAL(15,2) NOT NULL,
  
  statement_balance DECIMAL(15,2) NOT NULL,
  book_balance DECIMAL(15,2) NOT NULL,
  
  difference DECIMAL(15,2) GENERATED ALWAYS AS (statement_balance - book_balance) STORED,
  
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress', 'completed', 'reviewed', 'approved'
  )),
  
  reconciled_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bank_reconciliation_tenant ON bank_reconciliation(tenant_id);
CREATE INDEX idx_bank_reconciliation_account ON bank_reconciliation(bank_account_id);
CREATE INDEX idx_bank_reconciliation_date ON bank_reconciliation(reconciliation_date);

ALTER TABLE bank_reconciliation ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_bank_reconciliation_isolation ON bank_reconciliation
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- END OF MIGRATION 007
-- =====================================================================================
