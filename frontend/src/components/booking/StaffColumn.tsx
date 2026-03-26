/**
 * StaffColumn — Single staff member column in calendar grid
 * Displays time slots, appointments, and availability zones
 */

import React from 'react';
import { generateTimeSlots, getPixelPosition, AppointmentStatus } from './calendarEngine';
import { AppointmentBlock, type AppointmentBlockData } from './AppointmentBlock';

export interface StaffColumnAppointment {
  id: string;
  clientName: string;
  clientInitial: string;
  serviceName: string;
  serviceDuration: number;
  price?: number;
  status: AppointmentStatus;
  startMinutes: number;
  endMinutes: number;
}

interface StaffColumnProps {
  staffId: string;
  staffName: string;
  availability?: 'available' | 'busy' | 'break' | 'unavailable';
  appointments: StaffColumnAppointment[];
  startHour?: number;
  endHour?: number;
  pixelsPerMinute?: number;
  onAppointmentSelect: (appointmentId: string) => void;
  onAppointmentDragStart?: (e: React.DragEvent, appointmentId: string) => void;
  selectedAppointmentId?: string | null;
}

export const StaffColumn: React.FC<StaffColumnProps> = ({
  staffId,
  staffName,
  availability = 'available',
  appointments,
  startHour = 9,
  endHour = 18,
  pixelsPerMinute = 1.5,
  onAppointmentSelect,
  onAppointmentDragStart,
  selectedAppointmentId,
}) => {
  const slots = generateTimeSlots(startHour, endHour, 15);
  const dayStartMinutes = startHour * 60;
  const dayEndMinutes = endHour * 60;

  // Convert appointments to block data
  const appointmentBlocks: (AppointmentBlockData & { startMinutes: number })[] = appointments.map(apt => ({
    id: apt.id,
    clientName: apt.clientName,
    clientInitial: apt.clientInitial,
    serviceName: apt.serviceName,
    serviceDuration: apt.serviceDuration,
    staffName: staffName,
    price: apt.price,
    status: apt.status,
    top: getPixelPosition(apt.startMinutes, pixelsPerMinute),
    height: getPixelPosition(apt.endMinutes - apt.startMinutes, pixelsPerMinute),
    isSelected: apt.id === selectedAppointmentId,
    startMinutes: apt.startMinutes,
  }));

  const getAvailabilityColor = () => {
    switch (availability) {
      case 'busy':
        return 'rgba(239, 68, 68, 0.04)';
      case 'break':
        return 'rgba(245, 158, 11, 0.04)';
      case 'unavailable':
        return 'rgba(107, 114, 128, 0.06)';
      default:
        return 'transparent';
    }
  };

  const getAvailabilityBorder = () => {
    switch (availability) {
      case 'busy':
        return '1px solid rgba(239, 68, 68, 0.1)';
      case 'break':
        return '1px solid rgba(245, 158, 11, 0.1)';
      case 'unavailable':
        return '1px solid rgba(107, 114, 128, 0.2)';
      default:
        return '1px solid var(--color-border)';
    }
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: '180px',
        borderRight: '1px solid var(--color-border)',
        background: getAvailabilityColor(),
        border: getAvailabilityBorder(),
        position: 'relative',
      }}
    >
      {/* Staff header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          padding: '12px',
          background: 'var(--color-background-card)',
          borderBottom: '1px solid var(--color-border)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {staffName}
        </div>
        <div
          style={{
            fontSize: '10px',
            color:
              availability === 'available'
                ? 'var(--color-success)'
                : availability === 'busy'
                  ? 'var(--color-danger)'
                  : availability === 'break'
                    ? 'var(--color-warning)'
                    : 'var(--color-text-tertiary)',
            fontWeight: 600,
            textTransform: 'capitalize',
          }}
        >
          {availability}
        </div>
      </div>

      {/* Time grid and appointments */}
      <div style={{ position: 'relative', background: 'transparent' }}>
        {/* Background grid */}
        {slots.map((slot, idx) => (
          <div
            key={`grid-${slot.formatted}`}
            style={{
              position: 'absolute',
              top: `${getPixelPosition(slot.time, pixelsPerMinute)}px`,
              height: `${getPixelPosition(15, pixelsPerMinute)}px`,
              left: 0,
              right: 0,
              background:
                idx % 4 === 0
                  ? 'transparent'
                  : 'rgba(255,255,255,0.01)',
              borderBottom: '1px solid var(--color-border)',
              borderTop: idx % 4 === 0 ? '1px solid var(--color-border)' : 'none',
            }}
          />
        ))}

        {/* Appointments */}
        {appointmentBlocks.map(block => (
          <AppointmentBlock
            key={block.id}
            data={block}
            onSelect={onAppointmentSelect}
            onDragStart={onAppointmentDragStart}
            isDragging={false}
          />
        ))}
      </div>
    </div>
  );
};
