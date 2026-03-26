import { randomUUID } from 'crypto';

const ORG_ID = 'org-1';

export function createStaffMember(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || randomUUID(),
    organization_id: ORG_ID,
    full_name: overrides.full_name || 'Test Staff',
    email: overrides.email || 'test@local',
    phone: overrides.phone || null,
    role: overrides.role || 'practitioner',
    status: overrides.status || 'active',
    bio: overrides.bio || null,
    skills: overrides.skills || [],
    services: overrides.services || [],
    is_active: overrides.is_active !== undefined ? overrides.is_active : true,
    ...overrides
  };
}

export function createBooking(overrides: Partial<any> = {}) {
  const now = new Date().toISOString();
  return {
    id: overrides.id || randomUUID(),
    organization_id: ORG_ID,
    service_id: overrides.service_id || 'service-1',
    client_id: overrides.client_id || 'client-1',
    status: overrides.status || 'pending',
    start_time: overrides.start_time || now,
    end_time: overrides.end_time || now,
    created_at: overrides.created_at || now,
    ...overrides
  };
}

export function createStaffSkill(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || randomUUID(),
    staff_member_id: overrides.staff_member_id || 'staff-1',
    skill_name: overrides.skill_name || 'Swedish Massage',
    proficiency_level: overrides.proficiency_level || 'expert',
    ...overrides
  };
}

export function createAvailabilityRule(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || randomUUID(),
    staff_member_id: overrides.staff_member_id || 'staff-1',
    day_of_week: overrides.day_of_week || 1,
    start_time: overrides.start_time || '09:00:00',
    end_time: overrides.end_time || '17:00:00',
    is_active: overrides.is_active !== undefined ? overrides.is_active : true,
    ...overrides
  };
}

export function createAvailabilityException(overrides: Partial<any> = {}) {
  const now = new Date().toISOString();
  return {
    id: overrides.id || randomUUID(),
    staff_member_id: overrides.staff_member_id || 'staff-1',
    exception_type: overrides.exception_type || 'holiday',
    start_time: overrides.start_time || now,
    end_time: overrides.end_time || now,
    reason: overrides.reason || 'Test',
    ...overrides
  };
}

export function createBookingStaffAssignment(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || randomUUID(),
    booking_id: overrides.booking_id || 'booking-1',
    staff_member_id: overrides.staff_member_id || 'staff-1',
    assignment_type: overrides.assignment_type || 'primary',
    confirmation_status: overrides.confirmation_status || 'pending',
    ...overrides
  };
}

export function createWaitlistEntry(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || randomUUID(),
    organization_id: ORG_ID,
    customer_id: overrides.customer_id || 'client-1',
    service_id: overrides.service_id || 'service-1',
    status: overrides.status || 'waiting',
    position_in_queue: overrides.position_in_queue || 1,
    requested_date: overrides.requested_date || new Date().toISOString().split('T')[0],
    ...overrides
  };
}

export function createStaffServiceAssignment(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || randomUUID(),
    staff_member_id: overrides.staff_member_id || 'staff-1',
    service_id: overrides.service_id || 'service-1',
    can_perform_independently: overrides.can_perform_independently !== undefined ? overrides.can_perform_independently : true,
    ...overrides
  };
}

export function createPreference(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || randomUUID(),
    customer_id: overrides.customer_id || 'client-1',
    staff_member_id: overrides.staff_member_id || 'staff-1',
    preference_type: overrides.preference_type || 'preferred',
    strength: overrides.strength || 9,
    ...overrides
  };
}

export function createShift(overrides: Partial<any> = {}) {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: overrides.id || randomUUID(),
    staff_member_id: overrides.staff_member_id || 'staff-1',
    shift_date: overrides.shift_date || today,
    shift_start: overrides.shift_start || '09:00',
    shift_end: overrides.shift_end || '17:00',
    shift_status: overrides.shift_status || 'scheduled',
    ...overrides
  };
}

export function createAnomaly(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || 'anm-1',
    metric_name: overrides.metric_name || 'booking_rate',
    current_value: overrides.current_value || '2.1',
    severity: overrides.severity || 'high',
    created_at: overrides.created_at || '2025-01-01T00:00:00Z',
    ...overrides
  };
}

export function createPatient(overrides: Partial<any> = {}) {
  return {
    id: overrides.id || 'p1',
    organization_id: ORG_ID,
    customer_id: overrides.customer_id || 'c1',
    patient_number: overrides.patient_number || 'PAT-001',
    blood_type: overrides.blood_type || 'O+',
    allergies: overrides.allergies || [],
    current_medications: overrides.current_medications || [],
    conditions: overrides.conditions || [],
    insurance_provider: overrides.insurance_provider || null,
    emergency_contact_name: overrides.emergency_contact_name || null,
    created_at: overrides.created_at || new Date().toISOString(),
    ...overrides
  };
}

// Universal mock impl for queryDb/dbPool.query using factories
export async function buildUniversalMockImpl(query: string | [string], params: any[] = []) {
  const q = (Array.isArray(query) ? query[0] : query).trim().toLowerCase();

  if (q.includes('insert into staff_members')) return [createStaffMember({full_name: params[2], email: params[3], role: params[5]})];
  if (q.includes('from staff_members') && !q.includes('where id')) return [createStaffMember(), createStaffMember({id: 'staff2', status: 'archived', is_active: false})];
  if (q.includes('from staff_members') && q.includes('where id')) return [createStaffMember({id: params[0]})];
  if (q.includes('update staff_members')) return [createStaffMember({id: params[params.length-1] || 'staff1', bio: params[0] || null})];

  if (q.includes('insert into') && (q.includes('staff_skill') || q.includes('staff_member_skill'))) return [createStaffSkill({staff_member_id: params[0], skill_name: params[1]})];
  if (q.includes('from') && (q.includes('staff_skill') || q.includes('staff_member_skill'))) return [createStaffSkill(), createStaffSkill({skill_name: 'Deep Tissue'})];

  if (q.includes('insert into waitlist')) return [createWaitlistEntry({customer_id: params[1], service_id: params[2]})];
  if (q.includes('from waitlist') && q.includes('coalesce')) return [{ coalesce: 0 }];
  if (q.includes('from waitlist')) return [createWaitlistEntry()];

  if (q.includes('insert into') && q.includes('staff') && q.includes('service')) return [createStaffServiceAssignment({staff_member_id: params[0], service_id: params[1]})];
  if (q.includes('from') && q.includes('staff') && q.includes('service')) return [createStaffServiceAssignment()];
  if (q.includes('delete') && q.includes('staff') && q.includes('service')) return { rowCount: 1 };

  if (q.includes('insert into') && q.includes('availability') && q.includes('rule')) return [createAvailabilityRule({staff_member_id: params[0], day_of_week: params[1]})];
  if (q.includes('on conflict') && q.includes('availability') && q.includes('rule')) return [createAvailabilityRule({staff_member_id: params[0]})];
  if (q.includes('from') && q.includes('availability') && q.includes('rule')) return [createAvailabilityRule()];

  if (q.includes('insert into') && q.includes('availability') && q.includes('exception')) return [createAvailabilityException({staff_member_id: params[0], exception_type: params[1]})];
  if (q.includes('from') && q.includes('availability') && q.includes('exception')) return [createAvailabilityException()]; 

  if (q.includes('insert into bookings')) return [createBooking({service_id: params[1], client_id: params[2]})];
  if (q.includes('from bookings')) return [createBooking()];

  if (q.includes('insert into booking_staff_assignments')) return [createBookingStaffAssignment({booking_id: params[0], staff_member_id: params[1]})];
  if (q.includes('from booking_staff_assignments')) return [createBookingStaffAssignment()];

  if (q.includes('insert into') && q.includes('preference')) return [createPreference({customer_id: params[0], staff_member_id: params[1]})];
  if (q.includes('from') && q.includes('preference')) return [createPreference()];

  if (q.includes('insert into') && q.includes('shift')) return [createShift({staff_member_id: params[1]})];
  if (q.includes('from') && q.includes('shift')) return [createShift()];

  if (q.includes('from') && q.includes('anomalies') || q.includes('metric_name')) return [createAnomaly()];

  // PG-style for dbPool.query
  if (q.includes('delete')) return { rows: [], rowCount: 1 };

  // Default aggregates/numbers for analytics etc.
  if (q.includes('revenue') || q.includes('today')) return [{ today: '1000', this_week: '5000', this_month: '12000', last_month: '10000' }];
  if (q.includes('utilisation_rate_pct')) return [{ utilisation_rate_pct: '81.5', top_performer_id: 's1', understaffed_slots: '2' }];
  if (q.includes('no_show_rate_pct')) return [{ today_total: '8', no_show_rate_pct: '12.5' }];
  if (q.includes('active_count')) return [{ active_count: '50', at_churn_risk: '4' }];

  return [];
}

// Schema validation helper
export function assertShape(obj: any, requiredKeys: string[]) {
  requiredKeys.forEach(key => {
    if (!(key in obj)) {
      throw new Error(`Missing required field in mock: ${key}`);
    }
  });
}

