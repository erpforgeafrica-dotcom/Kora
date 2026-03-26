import { dbPool } from "../client.js";
import type { QueryResult } from "pg";

export interface BookingStaffAssignment {
  id: string;
  booking_id: string;
  staff_member_id: string;
  assignment_type: "primary" | "support" | "observer";
  assigned_at: string;
  assigned_by_user_id?: string;
  status: "assigned" | "confirmed" | "in_progress" | "completed" | "no_show" | "cancelled";
  confirmation_status: "pending" | "confirmed" | "declined" | "no_response";
  confirmed_at?: string;
  confirmed_by_user_id?: string;
  start_actual_time?: string;
  end_actual_time?: string;
  duration_minutes?: number;
  notes?: string;
  rating_from_staff?: number;
  rating_from_customer?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerStaffPreference {
  id: string;
  customer_id: string;
  staff_member_id: string;
  preference_type: "preferred" | "not_preferred";
  reason?: string;
  strength: number; // 1-10
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  business_id: string;
  customer_id: string;
  service_id: string;
  preferred_staff_id?: string;
  requested_date?: string;
  requested_time_window?: string; // morning, afternoon, evening
  position_in_queue: number;
  status: "waiting" | "notified" | "confirmed" | "expired" | "cancelled";
  notified_at?: string;
  expires_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffShift {
  id: string;
  business_id: string;
  staff_member_id: string;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  break_duration_minutes: number;
  assigned_location?: string;
  shift_status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  created_at: string;
  updated_at: string;
}

class BookingAssignmentRepository {
  /**
   * Get booking staff assignment by ID
   */
  async getAssignmentById(assignmentId: string): Promise<BookingStaffAssignment | null> {
    const result = await dbPool.query<BookingStaffAssignment>(
      `SELECT id, booking_id, staff_member_id, assignment_type, assigned_at, assigned_by_user_id,
              status, confirmation_status, confirmed_at, confirmed_by_user_id, 
              start_actual_time, end_actual_time, duration_minutes, notes, 
              rating_from_staff, rating_from_customer, created_at, updated_at
       FROM booking_staff_assignments WHERE id = $1`,
      [assignmentId]
    );
    return result.rows[0] || null;
  }

  /**
   * List assignments for a booking
   */
  async listByBooking(bookingId: string): Promise<BookingStaffAssignment[]> {
    const result = await dbPool.query<BookingStaffAssignment>(
      `SELECT id, booking_id, staff_member_id, assignment_type, assigned_at, assigned_by_user_id,
              status, confirmation_status, confirmed_at, confirmed_by_user_id, 
              start_actual_time, end_actual_time, duration_minutes, notes, 
              rating_from_staff, rating_from_customer, created_at, updated_at
       FROM booking_staff_assignments WHERE booking_id = $1
       ORDER BY assignment_type = 'primary' DESC, created_at ASC`,
      [bookingId]
    );
    return result.rows;
  }

  /**
   * List assignments for a staff member with optional filters
   */
  async listByStaff(
    staffId: string,
    options?: {
      status?: string;
      confirmationStatus?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<BookingStaffAssignment[]> {
    let query = `
      SELECT id, booking_id, staff_member_id, assignment_type, assigned_at, assigned_by_user_id,
             status, confirmation_status, confirmed_at, confirmed_by_user_id, 
             start_actual_time, end_actual_time, duration_minutes, notes, 
             rating_from_staff, rating_from_customer, created_at, updated_at
      FROM booking_staff_assignments WHERE staff_member_id = $1
    `;
    const params: unknown[] = [staffId];

    if (options?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(options.status);
    }
    if (options?.confirmationStatus) {
      query += ` AND confirmation_status = $${params.length + 1}`;
      params.push(options.confirmationStatus);
    }

    query += ` ORDER BY assigned_at DESC`;
    const limit = Math.min(options?.limit ?? 100, 100);
    const offset = options?.offset ?? 0;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const result = await dbPool.query<BookingStaffAssignment>(query, params);
    return result.rows;
  }

  /**
   * Create staff assignment for booking
   */
  async assign(
    bookingId: string,
    staffId: string,
    assignmentType: "primary" | "support" | "observer",
    assignedByUserId?: string
  ): Promise<BookingStaffAssignment> {
    const result = await dbPool.query<BookingStaffAssignment>(
      `INSERT INTO booking_staff_assignments 
       (booking_id, staff_member_id, assignment_type, assigned_by_user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, booking_id, staff_member_id, assignment_type, assigned_at, assigned_by_user_id,
                 status, confirmation_status, confirmed_at, confirmed_by_user_id, 
                 start_actual_time, end_actual_time, duration_minutes, notes, 
                 rating_from_staff, rating_from_customer, created_at, updated_at`,
      [bookingId, staffId, assignmentType, assignedByUserId || null]
    );
    return result.rows[0]!;
  }

  /**
   * Update assignment (status, confirmation, ratings)
   */
  async update(
    assignmentId: string,
    updates: Partial<BookingStaffAssignment>
  ): Promise<BookingStaffAssignment | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.status) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.confirmation_status) {
      fields.push(`confirmation_status = $${paramCount++}`);
      values.push(updates.confirmation_status);
    }
    if (updates.confirmed_at !== undefined) {
      fields.push(`confirmed_at = $${paramCount++}`);
      values.push(updates.confirmed_at);
    }
    if (updates.confirmed_by_user_id !== undefined) {
      fields.push(`confirmed_by_user_id = $${paramCount++}`);
      values.push(updates.confirmed_by_user_id);
    }
    if (updates.start_actual_time !== undefined) {
      fields.push(`start_actual_time = $${paramCount++}`);
      values.push(updates.start_actual_time);
    }
    if (updates.end_actual_time !== undefined) {
      fields.push(`end_actual_time = $${paramCount++}`);
      values.push(updates.end_actual_time);
    }
    if (updates.duration_minutes !== undefined) {
      fields.push(`duration_minutes = $${paramCount++}`);
      values.push(updates.duration_minutes);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramCount++}`);
      values.push(updates.notes);
    }
    if (updates.rating_from_staff !== undefined) {
      fields.push(`rating_from_staff = $${paramCount++}`);
      values.push(updates.rating_from_staff);
    }
    if (updates.rating_from_customer !== undefined) {
      fields.push(`rating_from_customer = $${paramCount++}`);
      values.push(updates.rating_from_customer);
    }

    if (fields.length === 0) return this.getAssignmentById(assignmentId);

    fields.push(`updated_at = now()`);
    const query = `UPDATE booking_staff_assignments SET ${fields.join(", ")} 
                   WHERE id = $${paramCount}
                   RETURNING id, booking_id, staff_member_id, assignment_type, assigned_at, assigned_by_user_id,
                             status, confirmation_status, confirmed_at, confirmed_by_user_id, 
                             start_actual_time, end_actual_time, duration_minutes, notes, 
                             rating_from_staff, rating_from_customer, created_at, updated_at`;
    values.push(assignmentId);

    const result = await dbPool.query<BookingStaffAssignment>(query, values);
    return result.rows[0] || null;
  }

  /**
   * Cancel assignment
   */
  async cancel(assignmentId: string): Promise<BookingStaffAssignment | null> {
    const result = await dbPool.query<BookingStaffAssignment>(
      `UPDATE booking_staff_assignments SET status = 'cancelled', updated_at = now()
       WHERE id = $1
       RETURNING id, booking_id, staff_member_id, assignment_type, assigned_at, assigned_by_user_id,
                 status, confirmation_status, confirmed_at, confirmed_by_user_id, 
                 start_actual_time, end_actual_time, duration_minutes, notes, 
                 rating_from_staff, rating_from_customer, created_at, updated_at`,
      [assignmentId]
    );
    return result.rows[0] || null;
  }

  /**
   * Set customer preference for staff
   */
  async setCustomerPreference(
    customerId: string,
    staffId: string,
    preferenceType: "preferred" | "not_preferred",
    options?: { reason?: string; strength?: number }
  ): Promise<CustomerStaffPreference> {
    const result = await dbPool.query<CustomerStaffPreference>(
      `INSERT INTO customer_staff_preferences 
       (customer_id, staff_member_id, preference_type, reason, strength)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (customer_id, staff_member_id) DO UPDATE SET
         preference_type = EXCLUDED.preference_type,
         reason = EXCLUDED.reason,
         strength = EXCLUDED.strength
       RETURNING id, customer_id, staff_member_id, preference_type, reason, strength, created_at`,
      [customerId, staffId, preferenceType, options?.reason || null, options?.strength ?? 5]
    );
    return result.rows[0]!;
  }

  /**
   * Get customer preferences for staff
   */
  async getCustomerPreferences(customerId: string): Promise<CustomerStaffPreference[]> {
    const result = await dbPool.query<CustomerStaffPreference>(
      `SELECT id, customer_id, staff_member_id, preference_type, reason, strength, created_at
       FROM customer_staff_preferences WHERE customer_id = $1
       ORDER BY strength DESC`,
      [customerId]
    );
    return result.rows;
  }

  /**
   * Add to waitlist
   */
  async addToWaitlist(
    businessId: string,
    customerId: string,
    serviceId: string,
    options?: {
      preferredStaffId?: string;
      requestedDate?: string;
      requestedTimeWindow?: string;
      notes?: string;
    }
  ): Promise<WaitlistEntry> {
    // Get current queue position
    const posResult = await dbPool.query<{ max_pos: string }>(
      `SELECT COALESCE(MAX(position_in_queue), 0) as max_pos FROM booking_waitlist 
       WHERE business_id = $1 AND status IN ('waiting', 'notified')`,
      [businessId]
    );
    const nextPosition = parseInt(posResult.rows[0]?.max_pos || "0", 10) + 1;

    const result = await dbPool.query<WaitlistEntry>(
      `INSERT INTO booking_waitlist 
       (business_id, customer_id, service_id, preferred_staff_id, requested_date, 
        requested_time_window, position_in_queue, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, business_id, customer_id, service_id, preferred_staff_id, 
                 requested_date, requested_time_window, position_in_queue, status, 
                 notified_at, expires_at, notes, created_at, updated_at`,
      [
        businessId,
        customerId,
        serviceId,
        options?.preferredStaffId || null,
        options?.requestedDate || null,
        options?.requestedTimeWindow || null,
        nextPosition,
        options?.notes || null
      ]
    );
    return result.rows[0]!;
  }

  /**
   * List waitlist entries for business/service
   */
  async getWaitlist(
    businessId: string,
    options?: {
      serviceId?: string;
      status?: string;
    }
  ): Promise<WaitlistEntry[]> {
    let query = `SELECT id, business_id, customer_id, service_id, preferred_staff_id, 
                       requested_date, requested_time_window, position_in_queue, status, 
                       notified_at, expires_at, notes, created_at, updated_at
                FROM booking_waitlist WHERE business_id = $1`;
    const params: unknown[] = [businessId];

    if (options?.serviceId) {
      query += ` AND service_id = $${params.length + 1}`;
      params.push(options.serviceId);
    }
    if (options?.status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(options.status);
    } else {
      query += ` AND status IN ('waiting', 'notified')`;
    }

    query += ` ORDER BY position_in_queue ASC`;
    const result = await dbPool.query<WaitlistEntry>(query, params);
    return result.rows;
  }

  /**
   * Mark waitlist entry as notified
   */
  async notifyWaitlistEntry(entryId: string): Promise<WaitlistEntry | null> {
    const result = await dbPool.query<WaitlistEntry>(
      `UPDATE booking_waitlist SET status = 'notified', notified_at = now()
       WHERE id = $1
       RETURNING id, business_id, customer_id, service_id, preferred_staff_id, 
                 requested_date, requested_time_window, position_in_queue, status, 
                 notified_at, expires_at, notes, created_at, updated_at`,
      [entryId]
    );
    return result.rows[0] || null;
  }

  /**
   * Remove waitlist entry (confirmed/expired)
   */
  async removeFromWaitlist(entryId: string, status: "confirmed" | "expired" | "cancelled"): Promise<WaitlistEntry | null> {
    const result = await dbPool.query<WaitlistEntry>(
      `UPDATE booking_waitlist SET status = $2, updated_at = now()
       WHERE id = $1
       RETURNING id, business_id, customer_id, service_id, preferred_staff_id, 
                 requested_date, requested_time_window, position_in_queue, status, 
                 notified_at, expires_at, notes, created_at, updated_at`,
      [entryId, status]
    );
    return result.rows[0] || null;
  }

  /**
   * Create staff shift
   */
  async createShift(
    businessId: string,
    staffId: string,
    shiftDate: string,
    shiftStart: string,
    shiftEnd: string,
    options?: {
      breakDurationMinutes?: number;
      assignedLocation?: string;
    }
  ): Promise<StaffShift> {
    const result = await dbPool.query<StaffShift>(
      `INSERT INTO staff_shifts 
       (business_id, staff_member_id, shift_date, shift_start, shift_end, break_duration_minutes, assigned_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, business_id, staff_member_id, shift_date, shift_start, shift_end, 
                 break_duration_minutes, assigned_location, shift_status, created_at, updated_at`,
      [
        businessId,
        staffId,
        shiftDate,
        shiftStart,
        shiftEnd,
        options?.breakDurationMinutes ?? 0,
        options?.assignedLocation || null
      ]
    );
    return result.rows[0]!;
  }

  /**
   * List shifts for staff member on date range
   */
  async getShifts(
    staffId: string,
    startDate: string,
    endDate: string
  ): Promise<StaffShift[]> {
    const result = await dbPool.query<StaffShift>(
      `SELECT id, business_id, staff_member_id, shift_date, shift_start, shift_end, 
              break_duration_minutes, assigned_location, shift_status, created_at, updated_at
       FROM staff_shifts 
       WHERE staff_member_id = $1 AND shift_date >= $2 AND shift_date <= $3
       ORDER BY shift_date ASC, shift_start ASC`,
      [staffId, startDate, endDate]
    );
    return result.rows;
  }

  /**
   * Update shift status
   */
  async updateShift(
    shiftId: string,
    shiftStatus: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show"
  ): Promise<StaffShift | null> {
    const result = await dbPool.query<StaffShift>(
      `UPDATE staff_shifts SET shift_status = $2, updated_at = now()
       WHERE id = $1
       RETURNING id, business_id, staff_member_id, shift_date, shift_start, shift_end, 
                 break_duration_minutes, assigned_location, shift_status, created_at, updated_at`,
      [shiftId, shiftStatus]
    );
    return result.rows[0] || null;
  }
}

export const bookingAssignmentRepository = new BookingAssignmentRepository();
