-- =====================================================================================
-- Migration 005: HRM Core
-- =====================================================================================
-- Employees, Contracts, Attendance, Shifts, Leave, Payroll, Performance, Rewards
-- =====================================================================================

-- =====================================================================================
-- EMPLOYEES
-- =====================================================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  
  employee_number TEXT UNIQUE NOT NULL,
  
  job_title TEXT NOT NULL,
  employment_type VARCHAR(50) NOT NULL CHECK (employment_type IN (
    'full_time', 'part_time', 'contract', 'temporary', 'intern', 'consultant', 'freelancer'
  )),
  employment_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (employment_status IN (
    'active', 'probation', 'suspended', 'on_leave', 'terminated', 'resigned', 'retired'
  )),
  
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  hire_date DATE NOT NULL,
  probation_end_date DATE,
  termination_date DATE,
  termination_reason TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_employees_person ON employees(person_id);
CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_branch ON employees(branch_id);
CREATE INDEX idx_employees_number ON employees(employee_number);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_employees_isolation ON employees
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- EMPLOYEE CONTRACTS
-- =====================================================================================
CREATE TABLE employee_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN (
    'permanent', 'fixed_term', 'probation', 'casual', 'consultant', 'freelance'
  )),
  
  start_date DATE NOT NULL,
  end_date DATE,
  
  salary_amount DECIMAL(15,2) NOT NULL,
  salary_currency VARCHAR(3) DEFAULT 'USD',
  salary_period VARCHAR(20) CHECK (salary_period IN ('hourly', 'daily', 'weekly', 'monthly', 'annual')),
  
  contract_document_url TEXT,
  
  signed_by_employee BOOLEAN DEFAULT FALSE,
  signed_by_employer BOOLEAN DEFAULT FALSE,
  signed_date DATE,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_contracts_tenant ON employee_contracts(tenant_id);
CREATE INDEX idx_employee_contracts_employee ON employee_contracts(employee_id);

ALTER TABLE employee_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_employee_contracts_isolation ON employee_contracts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- SHIFTS
-- =====================================================================================
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  shift_name TEXT NOT NULL,
  shift_code TEXT UNIQUE NOT NULL,
  
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  
  is_night_shift BOOLEAN DEFAULT FALSE,
  grace_period_minutes INTEGER DEFAULT 15,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shifts_tenant ON shifts(tenant_id);
CREATE INDEX idx_shifts_org ON shifts(organization_id);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_shifts_isolation ON shifts
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- EMPLOYEE ATTENDANCE
-- =====================================================================================
CREATE TABLE employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  
  attendance_date DATE NOT NULL,
  
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  
  clock_in_method VARCHAR(50) CHECK (clock_in_method IN (
    'face', 'fingerprint', 'qr_code', 'nfc', 'gps', 'manual', 'biometric'
  )),
  clock_out_method VARCHAR(50) CHECK (clock_out_method IN (
    'face', 'fingerprint', 'qr_code', 'nfc', 'gps', 'manual', 'biometric'
  )),
  
  clock_in_location GEOGRAPHY(POINT),
  clock_out_location GEOGRAPHY(POINT),
  
  clock_in_device TEXT,
  clock_out_device TEXT,
  
  status VARCHAR(50) DEFAULT 'present' CHECK (status IN (
    'present', 'late', 'absent', 'on_leave', 'half_day', 'overtime'
  )),
  
  late_minutes INTEGER DEFAULT 0,
  overtime_minutes INTEGER DEFAULT 0,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, attendance_date)
);

CREATE INDEX idx_employee_attendance_tenant ON employee_attendance(tenant_id);
CREATE INDEX idx_employee_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX idx_employee_attendance_date ON employee_attendance(attendance_date);

ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_employee_attendance_isolation ON employee_attendance
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- EMPLOYEE LEAVE
-- =====================================================================================
CREATE TABLE employee_leave (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN (
    'annual', 'sick', 'maternity', 'paternity', 'compassionate', 'study', 'unpaid', 'casual', 'other'
  )),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  
  reason TEXT,
  
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'cancelled'
  )),
  
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_leave_tenant ON employee_leave(tenant_id);
CREATE INDEX idx_employee_leave_employee ON employee_leave(employee_id);
CREATE INDEX idx_employee_leave_status ON employee_leave(status);

ALTER TABLE employee_leave ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_employee_leave_isolation ON employee_leave
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- EMPLOYEE PAYROLL
-- =====================================================================================
CREATE TABLE employee_payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  payroll_period_start DATE NOT NULL,
  payroll_period_end DATE NOT NULL,
  payment_date DATE,
  
  base_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  allowances DECIMAL(15,2) DEFAULT 0,
  bonus DECIMAL(15,2) DEFAULT 0,
  commission DECIMAL(15,2) DEFAULT 0,
  overtime DECIMAL(15,2) DEFAULT 0,
  
  gross_salary DECIMAL(15,2) NOT NULL,
  
  tax DECIMAL(15,2) DEFAULT 0,
  pension DECIMAL(15,2) DEFAULT 0,
  loan_deduction DECIMAL(15,2) DEFAULT 0,
  other_deductions DECIMAL(15,2) DEFAULT 0,
  
  total_deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(15,2) NOT NULL,
  
  currency VARCHAR(3) DEFAULT 'USD',
  
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_approval', 'approved', 'paid', 'cancelled'
  )),
  
  paid_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  
  payment_method VARCHAR(50),
  payment_reference TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employee_payroll_tenant ON employee_payroll(tenant_id);
CREATE INDEX idx_employee_payroll_employee ON employee_payroll(employee_id);
CREATE INDEX idx_employee_payroll_period ON employee_payroll(payroll_period_start, payroll_period_end);
CREATE INDEX idx_employee_payroll_status ON employee_payroll(status);

ALTER TABLE employee_payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_employee_payroll_isolation ON employee_payroll
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- STAFF REWARDS
-- =====================================================================================
CREATE TABLE staff_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  reward_type VARCHAR(100) NOT NULL CHECK (reward_type IN (
    'performance_bonus', 'sales_commission', 'best_employee', 'attendance_bonus',
    'referral_bonus', 'innovation_award', 'customer_service_award', 'other'
  )),
  
  reward_amount DECIMAL(15,2) DEFAULT 0,
  reward_points INTEGER DEFAULT 0,
  
  reason TEXT NOT NULL,
  
  awarded_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_rewards_tenant ON staff_rewards(tenant_id);
CREATE INDEX idx_staff_rewards_employee ON staff_rewards(employee_id);

ALTER TABLE staff_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_staff_rewards_isolation ON staff_rewards
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- PERFORMANCE REVIEWS
-- =====================================================================================
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  review_date DATE NOT NULL,
  
  performance_rating DECIMAL(3,2) CHECK (performance_rating >= 0 AND performance_rating <= 5),
  
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  comments TEXT,
  
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged', 'archived')),
  
  employee_acknowledgement BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_reviews_tenant ON performance_reviews(tenant_id);
CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_performance_reviews_isolation ON performance_reviews
  FOR ALL TO authenticated USING (tenant_id = kora_current_tenant_id());

-- =====================================================================================
-- END OF MIGRATION 005
-- =====================================================================================
