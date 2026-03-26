/**
 * CalendarGrid — Main calendar visualization
 * Time-based grid with multiple staff columns and appointment blocks
 */

import React, { useState, useCallback } from 'react';
import { TimeColumn } from './TimeColumn';
import { StaffColumn, type StaffColumnAppointment } from './StaffColumn';
import { detectConflicts } from './calendarEngine';

export interface StaffMember {
  id: string;
  name: string;
  availability: 'available' | 'busy' | 'break' | 'unavailable';
}

export interface CalendarAppointment extends StaffColumnAppointment {
  staffId: string;
}

interface CalendarGridProps {
  staff: StaffMember[];
  appointments: CalendarAppointment[];
  startHour?: number;
  endHour?: number;
  onAppointmentSelect: (appointmentId: string) => void;
  onAppointmentReschedule?: (appointmentId: string, newStartMin: number) => void;
  selectedAppointmentId?: string | null;
  showConflicts?: boolean;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  staff,
  appointments,
  startHour = 9,
  endHour = 18,
  onAppointmentSelect,
  onAppointmentReschedule,
  selectedAppointmentId,
  showConflicts = true,
}) => {
  const [draggedAppointmentId, setDraggedAppointmentId] = useState<string | null>(null);
  const [dragSource, setDragSource] = useState<{ staffId: string; startMin: number } | null>(null);
  const [conflictList, setConflictList] = useState<string[]>([]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, appointmentId: string) => {
      const apt = appointments.find(a => a.id === appointmentId);
      if (apt) {
        setDraggedAppointmentId(appointmentId);
        setDragSource({ staffId: apt.staffId, startMin: apt.startMinutes });
        e.dataTransfer.effectAllowed = 'move';
      }
    },
    [appointments]
  );

  // Check for conflicts on mount
  React.useEffect(() => {
    if (showConflicts) {
      const conflicts = detectConflicts(
        appointments.map(apt => ({
          id: apt.id,
          startMin: apt.startMinutes,
          endMin: apt.endMinutes,
          staffId: apt.staffId,
        }))
      );
      setConflictList(conflicts);
    }
  }, [appointments, showConflicts]);

  // Group appointments by staff
  const appointmentsByStaff = new Map<string, CalendarAppointment[]>();
  for (const apt of appointments) {
    if (!appointmentsByStaff.has(apt.staffId)) {
      appointmentsByStaff.set(apt.staffId, []);
    }
    appointmentsByStaff.get(apt.staffId)!.push(apt);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Conflict warnings */}
      {conflictList.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px 8px 0 0',
            fontSize: '12px',
            color: '#ef4444',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 700 }}>⚠️ Scheduling Conflicts:</span>
          {conflictList.map((conflict, i) => (
            <span key={i} style={{ fontSize: '11px' }}>
              {conflict}
            </span>
          ))}
        </div>
      )}

      {/* Calendar grid container */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'auto',
          background: 'var(--color-background-card)',
        }}
      >
        {/* Time column (sticky left) */}
        <div style={{ position: 'sticky', left: 0, zIndex: 30 }}>
          <TimeColumn startHour={startHour} endHour={endHour} />
        </div>

        {/* Staff columns */}
        <div style={{ display: 'flex', flex: 1 }}>
          {staff.map(member => (
            <StaffColumn
              key={member.id}
              staffId={member.id}
              staffName={member.name}
              availability={member.availability}
              appointments={appointmentsByStaff.get(member.id) || []}
              startHour={startHour}
              endHour={endHour}
              onAppointmentSelect={onAppointmentSelect}
              onAppointmentDragStart={handleDragStart}
              selectedAppointmentId={selectedAppointmentId}
            />
          ))}
        </div>
      </div>

      {/* Drag overlay indicator */}
      {draggedAppointmentId && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: 20,
            padding: '12px 16px',
            background: 'rgba(0,229,200,0.15)',
            border: '1px solid rgba(0,229,200,0.3)',
            borderRadius: 8,
            fontSize: '12px',
            color: 'var(--color-accent-teal)',
            fontWeight: 700,
            zIndex: 100,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          Drag to reschedule appointment
        </div>
      )}
    </div>
  );
};
