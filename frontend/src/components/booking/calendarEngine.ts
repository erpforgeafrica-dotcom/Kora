/**
 * Calendar Engine - Time Grid & Scheduling Math
 * Production-grade scheduling calculation system
 */

export interface TimeSlot {
  time: number; // minutes from day start (0-1440)
  hour: number;
  minute: number;
  formatted: string; // "09:00"
}

export interface AvailabilityBlock {
  staffId: string;
  startMinutes: number;
  endMinutes: number;
  duration: number;
}

/**
 * Generate 15-minute time slots for a business day
 * @param startHour - Business start (e.g., 9)
 * @param endHour - Business end (e.g., 18)
 * @returns Array of time slots
 */
export function generateTimeSlots(
  startHour: number = 9,
  endHour: number = 18,
  intervalMinutes: number = 15
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayStartMinutes = startHour * 60;
  const dayEndMinutes = endHour * 60;

  for (let minutes = dayStartMinutes; minutes <= dayEndMinutes; minutes += intervalMinutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;

    slots.push({
      time: minutes,
      hour,
      minute,
      formatted: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    });
  }

  return slots;
}

/**
 * Calculate pixel position based on minutes from day start
 * @param minutes - Minutes from start of day
 * @param pixelsPerMinute - Scale factor (default 1.5px per minute)
 * @returns Pixel offset from top
 */
export function getPixelPosition(
  minutes: number,
  pixelsPerMinute: number = 1.5
): number {
  return minutes * pixelsPerMinute;
}

/**
 * Calculate appointment height in pixels
 * @param durationMinutes - Duration of appointment
 * @param pixelsPerMinute - Scale factor
 * @returns Height in pixels
 */
export function getAppointmentHeight(
  durationMinutes: number,
  pixelsPerMinute: number = 1.5
): number {
  return durationMinutes * pixelsPerMinute;
}

/**
 * Parse ISO time string to minutes from day start
 */
export function timeStringToMinutes(isoString: string): number {
  const date = new Date(isoString);
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Get minutes from day start for current time
 */
export function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Calculate appointment duration in minutes
 */
export function calculateDuration(
  startTime: string,
  endTime: string
): number {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Check if two appointments overlap
 */
export function hasConflict(
  apt1Start: number,
  apt1End: number,
  apt2Start: number,
  apt2End: number
): boolean {
  return apt1Start < apt2End && apt1End > apt2Start;
}

/**
 * Find first available slot for given duration
 */
export function findAvailableSlot(
  requestedDurationMin: number,
  availableSlots: TimeSlot[],
  existingAppointments: Array<{ startMin: number; endMin: number }>,
  bufferMinutes: number = 0
): TimeSlot | null {
  for (const slot of availableSlots) {
    const potentialEnd = slot.time + requestedDurationMin + bufferMinutes;

    const hasConflictWithExisting = existingAppointments.some(apt =>
      hasConflict(slot.time, potentialEnd, apt.startMin, apt.endMin)
    );

    if (!hasConflictWithExisting) {
      return slot;
    }
  }

  return null;
}

/**
 * Detect and flag conflicts
 */
export function detectConflicts(
  appointments: Array<{
    id: string;
    startMin: number;
    endMin: number;
    staffId: string;
  }>
): string[] {
  const conflicts: string[] = [];
  const byStaff = new Map<string, typeof appointments>();

  // Group by staff
  for (const apt of appointments) {
    if (!byStaff.has(apt.staffId)) {
      byStaff.set(apt.staffId, []);
    }
    byStaff.get(apt.staffId)!.push(apt);
  }

  // Check for overlaps within each staff
  for (const [staffId, staffApts] of byStaff) {
    for (let i = 0; i < staffApts.length; i++) {
      for (let j = i + 1; j < staffApts.length; j++) {
        const apt1 = staffApts[i];
        const apt2 = staffApts[j];

        if (hasConflict(apt1.startMin, apt1.endMin, apt2.startMin, apt2.endMin)) {
          conflicts.push(`Staff ${staffId}: ${apt1.id} conflicts with ${apt2.id}`);
        }
      }
    }
  }

  return conflicts;
}

/**
 * Color-coded status mapper
 */
export const STATUS_COLORS = {
  confirmed: '#00e5c8',    // teal
  checked_in: '#3b82f6',   // blue
  in_progress: '#f59e0b',  // amber
  completed: '#10b981',    // green
  no_show: '#ef4444',      // red
} as const;

/**
 * Appointment status type
 */
export type AppointmentStatus = keyof typeof STATUS_COLORS;

/**
 * Get color for status
 */
export function getStatusColor(status: AppointmentStatus): string {
  return STATUS_COLORS[status];
}
