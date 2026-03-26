/**
 * AppointmentBlock — Draggable appointment card in calendar
 * Supports drag-to-reschedule, status updates, and visual status indicators
 */

import React, { useState } from 'react';
import { getStatusColor, type AppointmentStatus } from './calendarEngine';

export interface AppointmentBlockData {
  id: string;
  clientName: string;
  clientInitial: string;
  serviceName: string;
  serviceDuration: number;
  staffName: string;
  price?: number;
  status: AppointmentStatus;
  top: number; // pixel offset
  height: number; // pixel height
  isSelected?: boolean;
}

interface AppointmentBlockProps {
  data: AppointmentBlockData;
  onSelect: (id: string) => void;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onContextMenu?: (e: React.MouseEvent, id: string) => void;
  isDragging?: boolean;
}

export const AppointmentBlock: React.FC<AppointmentBlockProps> = ({
  data,
  onSelect,
  onDragStart,
  onContextMenu,
  isDragging
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const statusColor = getStatusColor(data.status);

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart?.(e, data.id);
        setIsHovering(false);
      }}
      onClick={() => onSelect(data.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, data.id);
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: 'absolute',
        top: `${data.top}px`,
        height: `${data.height}px`,
        left: '4px',
        right: '4px',
        background: data.isSelected
          ? `${statusColor}22`
          : isHovering
            ? 'rgba(0,229,200,0.08)'
            : 'rgba(255,255,255,0.04)',
        border: data.isSelected
          ? `2px solid ${statusColor}`
          : `1px solid ${statusColor}40`,
        borderLeft: `3px solid ${statusColor}`,
        borderRadius: '8px',
        padding: '8px 10px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'all 0.2s ease-out',
        opacity: isDragging ? 0.7 : 1,
        transform: isHovering ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: isHovering
          ? '0 8px 20px rgba(0,229,200,0.15)'
          : data.isSelected
            ? `0 4px 12px ${statusColor}20`
            : 'none',
        userSelect: 'none',
        zIndex: data.isSelected ? 10 : isHovering ? 8 : 2,
      }}
    >
      {/* Client initials badge */}
      <div
        style={{
          position: 'absolute',
          top: '-8px',
          left: '8px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: statusColor,
          border: '2px solid var(--color-background-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--color-background-dark)',
        }}
      >
        {data.clientInitial}
      </div>

      {/* Status indicator dot */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: statusColor,
          opacity: 0.7,
        }}
      />

      {/* Content */}
      <div style={{ paddingRight: '16px', paddingTop: '8px' }}>
        {/* Client name */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '2px',
          }}
        >
          {data.clientName}
        </div>

        {/* Service name and duration */}
        <div
          style={{
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '1px',
          }}
        >
          {data.serviceName} · {data.serviceDuration}m
        </div>

        {/* Staff and price */}
        {data.height > 60 && (
          <div
            style={{
              fontSize: '9px',
              color: 'var(--color-text-tertiary)',
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '3px',
            }}
          >
            <span>{data.staffName}</span>
            {data.price && <span>£{data.price}</span>}
          </div>
        )}
      </div>

      {/* Status badge - positioned at bottom if enough height */}
      {data.height > 50 && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            padding: '2px 6px',
            background: `${statusColor}20`,
            border: `1px solid ${statusColor}40`,
            borderRadius: '3px',
            fontSize: '7px',
            fontWeight: 700,
            color: statusColor,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {data.status}
        </div>
      )}

      {/* Resize handle (for future resize-to-extend) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(to top, ${statusColor}40, transparent)`,
          cursor: 'ns-resize',
        }}
      />
    </div>
  );
};
