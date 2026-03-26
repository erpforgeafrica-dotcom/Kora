import { dbPool } from "../client.js";
import type { QueryResult } from "pg";

export interface AvailabilityRule {
  id: string;
  staff_member_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string; // HH:MM:SS
  end_time: string;
  break_start?: string;
  break_end?: string;
  max_appointments_per_day: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityException {
  id: string;
  staff_member_id: string;
  exception_type: "blockout" | "holiday" | "training" | "day_off" | "special_hours";
  start_time: string; // TIMESTAMPTZ
  end_time: string;
  reason?: string;
  notes?: string;
  requires_approval: boolean;
  approved_at?: string;
  created_at: string;
}

export interface AvailabilitySlot {
  id: string;
  staff_member_id: string;
  slot_start: string;
  slot_end: string;
  is_booked: boolean;
  booking_id?: string;
  confidence_score: number;
  created_at: string;
  expires_at?: string;
}

export interface AvailabilityConflict {
  id: string;
  staff_member_id: string;
  conflict_type: "double_booking" | "availability_violation" | "skill_mismatch";
  booking_id?: string;
  conflicting_booking_id?: string;
  detected_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

class AvailabilityRepository {
  /**
   * Get availability rule by ID
   */
  async getRuleById(ruleId: string): Promise<AvailabilityRule | null> {
    const result = await dbPool.query<AvailabilityRule>(
      `SELECT id, staff_member_id, day_of_week, start_time, end_time, break_start, 
              break_end, max_appointments_per_day, is_active, created_at, updated_at
       FROM staff_availability_rules WHERE id = $1`,
      [ruleId]
    );
    return result.rows[0] || null;
  }

  /**
   * List availability rules for a staff member
   */
  async listRulesByStaff(staffId: string, onlyActive?: boolean): Promise<AvailabilityRule[]> {
    const query = onlyActive
      ? `SELECT id, staff_member_id, day_of_week, start_time, end_time, break_start, 
                break_end, max_appointments_per_day, is_active, created_at, updated_at
         FROM staff_availability_rules 
         WHERE staff_member_id = $1 AND is_active = true
         ORDER BY day_of_week ASC`
      : `SELECT id, staff_member_id, day_of_week, start_time, end_time, break_start, 
                break_end, max_appointments_per_day, is_active, created_at, updated_at
         FROM staff_availability_rules 
         WHERE staff_member_id = $1
         ORDER BY day_of_week ASC`;
    const result = await dbPool.query<AvailabilityRule>(query, [staffId]);
    return result.rows;
  }

  /**
   * Upsert availability rule for a day of week
   */
  async upsertRule(
    staffId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    options?: {
      breakStart?: string;
      breakEnd?: string;
      maxAppointmentsPerDay?: number;
      isActive?: boolean;
    }
  ): Promise<AvailabilityRule> {
    const result = await dbPool.query<AvailabilityRule>(
      `INSERT INTO staff_availability_rules 
       (staff_member_id, day_of_week, start_time, end_time, break_start, break_end, max_appointments_per_day, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (staff_member_id, day_of_week) DO UPDATE SET
         start_time = EXCLUDED.start_time,
         end_time = EXCLUDED.end_time,
         break_start = EXCLUDED.break_start,
         break_end = EXCLUDED.break_end,
         max_appointments_per_day = EXCLUDED.max_appointments_per_day,
         is_active = EXCLUDED.is_active,
         updated_at = now()
       RETURNING id, staff_member_id, day_of_week, start_time, end_time, break_start, 
                 break_end, max_appointments_per_day, is_active, created_at, updated_at`,
      [
        staffId,
        dayOfWeek,
        startTime,
        endTime,
        options?.breakStart || null,
        options?.breakEnd || null,
        options?.maxAppointmentsPerDay ?? 10,
        options?.isActive !== false
      ]
    );
    return result.rows[0]!;
  }

  /**
   * Create availability exception (blockout, holiday, etc.)
   */
  async createException(
    staffId: string,
    exceptionType: "blockout" | "holiday" | "training" | "day_off" | "special_hours",
    startTime: string,
    endTime: string,
    options?: {
      reason?: string;
      notes?: string;
      requiresApproval?: boolean;
    }
  ): Promise<AvailabilityException> {
    const result = await dbPool.query<AvailabilityException>(
      `INSERT INTO staff_availability_exceptions 
       (staff_member_id, exception_type, start_time, end_time, reason, notes, requires_approval)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, staff_member_id, exception_type, start_time, end_time, reason, 
                 notes, requires_approval, approved_at, created_at`,
      [
        staffId,
        exceptionType,
        startTime,
        endTime,
        options?.reason || null,
        options?.notes || null,
        options?.requiresApproval ?? false
      ]
    );
    return result.rows[0]!;
  }

  /**
   * List availability exceptions for a staff member
   */
  async listExceptionsByStaff(
    staffId: string,
    options?: {
      exceptionType?: string;
      startAfter?: string;
      endBefore?: string;
    }
  ): Promise<AvailabilityException[]> {
    let query = `
      SELECT id, staff_member_id, exception_type, start_time, end_time, reason, 
             notes, requires_approval, approved_at, created_at
      FROM staff_availability_exceptions WHERE staff_member_id = $1
    `;
    const params: unknown[] = [staffId];

    if (options?.exceptionType) {
      query += ` AND exception_type = $${params.length + 1}`;
      params.push(options.exceptionType);
    }
    if (options?.startAfter) {
      query += ` AND start_time >= $${params.length + 1}`;
      params.push(options.startAfter);
    }
    if (options?.endBefore) {
      query += ` AND end_time <= $${params.length + 1}`;
      params.push(options.endBefore);
    }

    query += ` ORDER BY start_time DESC`;
    const result = await dbPool.query<AvailabilityException>(query, params);
    return result.rows;
  }

  /**
   * Create availability slot (generated from rules + exceptions)
   */
  async createSlot(
    staffId: string,
    slotStart: string,
    slotEnd: string,
    options?: {
      bookingId?: string;
      confidenceScore?: number;
      expiresAt?: string;
    }
  ): Promise<AvailabilitySlot> {
    const result = await dbPool.query<AvailabilitySlot>(
      `INSERT INTO staff_availability_slots 
       (staff_member_id, slot_start, slot_end, booking_id, confidence_score, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, staff_member_id, slot_start, slot_end, is_booked, booking_id, 
                 confidence_score, created_at, expires_at`,
      [
        staffId,
        slotStart,
        slotEnd,
        options?.bookingId || null,
        options?.confidenceScore ?? 1.0,
        options?.expiresAt || null
      ]
    );
    return result.rows[0]!;
  }

  /**
   * List available slots for staff member within date range
   */
  async listAvailableSlots(
    staffId: string,
    startDate: string,
    endDate: string,
    onlyUnbooked?: boolean
  ): Promise<AvailabilitySlot[]> {
    const query = onlyUnbooked
      ? `SELECT id, staff_member_id, slot_start, slot_end, is_booked, booking_id, 
                confidence_score, created_at, expires_at
         FROM staff_availability_slots 
         WHERE staff_member_id = $1 
         AND slot_start >= $2 
         AND slot_end <= $3
         AND is_booked = false
         AND (expires_at IS NULL OR expires_at > now())
         ORDER BY slot_start ASC`
      : `SELECT id, staff_member_id, slot_start, slot_end, is_booked, booking_id, 
                confidence_score, created_at, expires_at
         FROM staff_availability_slots 
         WHERE staff_member_id = $1 
         AND slot_start >= $2 
         AND slot_end <= $3
         ORDER BY slot_start ASC`;
    const result = await dbPool.query<AvailabilitySlot>(query, [staffId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Book an availability slot
   */
  async bookSlot(slotId: string, bookingId: string): Promise<AvailabilitySlot | null> {
    const result = await dbPool.query<AvailabilitySlot>(
      `UPDATE staff_availability_slots 
       SET is_booked = true, booking_id = $2
       WHERE id = $1
       RETURNING id, staff_member_id, slot_start, slot_end, is_booked, booking_id, 
                 confidence_score, created_at, expires_at`,
      [slotId, bookingId]
    );
    return result.rows[0] || null;
  }

  /**
   * Release a booked slot
   */
  async releaseSlot(slotId: string): Promise<AvailabilitySlot | null> {
    const result = await dbPool.query<AvailabilitySlot>(
      `UPDATE staff_availability_slots 
       SET is_booked = false, booking_id = NULL
       WHERE id = $1
       RETURNING id, staff_member_id, slot_start, slot_end, is_booked, booking_id, 
                 confidence_score, created_at, expires_at`,
      [slotId]
    );
    return result.rows[0] || null;
  }

  /**
   * Check for conflicts in a time slot
   */
  async checkConflicts(
    staffId: string,
    slotStart: string,
    slotEnd: string,
    excludeBookingId?: string
  ): Promise<AvailabilityConflict[]> {
    const query = excludeBookingId
      ? `SELECT id, staff_member_id, conflict_type, booking_id, conflicting_booking_id, 
                detected_at, resolved_at, resolution_notes
         FROM availability_conflicts 
         WHERE staff_member_id = $1 
         AND resolved_at IS NULL
         AND (
           (SELECT COUNT(*) FROM booking_staff_assignments 
            WHERE staff_member_id = $1 
            AND booking_id != $4
            AND status NOT IN ('cancelled', 'no_show')
            AND (SELECT (scheduled_start_time, scheduled_end_time) 
                 FROM bookings WHERE id = booking_id) 
                OVERLAPS ($2::TIMESTAMP, $3::TIMESTAMP)) > 0
         )`
      : `SELECT id, staff_member_id, conflict_type, booking_id, conflicting_booking_id, 
                detected_at, resolved_at, resolution_notes
         FROM availability_conflicts 
         WHERE staff_member_id = $1 AND resolved_at IS NULL`;
    const params = excludeBookingId ? [staffId, slotStart, slotEnd, excludeBookingId] : [staffId];
    const result = await dbPool.query<AvailabilityConflict>(query, params);
    return result.rows;
  }

  /**
   * Record a conflict
   */
  async recordConflict(
    staffId: string,
    conflictType: "double_booking" | "availability_violation" | "skill_mismatch",
    options?: {
      bookingId?: string;
      conflictingBookingId?: string;
      resolutionNotes?: string;
    }
  ): Promise<AvailabilityConflict> {
    const result = await dbPool.query<AvailabilityConflict>(
      `INSERT INTO availability_conflicts 
       (staff_member_id, conflict_type, booking_id, conflicting_booking_id, resolution_notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, staff_member_id, conflict_type, booking_id, conflicting_booking_id, 
                 detected_at, resolved_at, resolution_notes`,
      [
        staffId,
        conflictType,
        options?.bookingId || null,
        options?.conflictingBookingId || null,
        options?.resolutionNotes || null
      ]
    );
    return result.rows[0]!;
  }

  /**
   * Mark conflict as resolved
   */
  async resolveConflict(conflictId: string, notes?: string): Promise<AvailabilityConflict | null> {
    const result = await dbPool.query<AvailabilityConflict>(
      `UPDATE availability_conflicts 
       SET resolved_at = now(), resolution_notes = COALESCE($2, resolution_notes)
       WHERE id = $1
       RETURNING id, staff_member_id, conflict_type, booking_id, conflicting_booking_id, 
                 detected_at, resolved_at, resolution_notes`,
      [conflictId, notes || null]
    );
    return result.rows[0] || null;
  }
}

export const availabilityRepository = new AvailabilityRepository();
