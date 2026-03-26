/**
 * TimeColumn — Vertical time axis for calendar grid
 * Displays hour labels and current time indicator
 */

import React, { useEffect, useState } from 'react';
import { generateTimeSlots, getCurrentMinutes, getPixelPosition } from './calendarEngine';

interface TimeColumnProps {
  startHour?: number;
  endHour?: number;
  pixelsPerMinute?: number;
  showCurrentTime?: boolean;
}

export const TimeColumn: React.FC<TimeColumnProps> = ({
  startHour = 9,
  endHour = 18,
  pixelsPerMinute = 1.5,
  showCurrentTime = true
}) => {
  const [currentMinutes, setCurrentMinutes] = useState(getCurrentMinutes());
  const slots = generateTimeSlots(startHour, endHour, 60); // Hour slots for header

  useEffect(() => {
    if (!showCurrentTime) return;

    const timer = setInterval(() => {
      setCurrentMinutes(getCurrentMinutes());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [showCurrentTime]);

  const isCurrentHourBetween = currentMinutes >= startHour * 60 && currentMinutes <= endHour * 60;
  const currentPixelPosition = getPixelPosition(currentMinutes, pixelsPerMinute);

  return (
    <div
      style={{
        width: '60px',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-background-secondary)',
        position: 'relative',
      }}
    >
      {/* Hour labels */}
      {slots.map((slot) => (
        <div
          key={slot.formatted}
          style={{
            position: 'absolute',
            top: `${getPixelPosition(slot.time, pixelsPerMinute)}px`,
            left: 0,
            right: 0,
            height: '60px',
            paddingRight: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            paddingTop: '4px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-text-tertiary)',
            textAlign: 'right',
            borderTop: slot === slots[0] ? 'none' : '1px solid var(--color-border)',
          }}
        >
          {slot.formatted}
        </div>
      ))}

      {/* Current time indicator */}
      {showCurrentTime && isCurrentHourBetween && (
        <>
          {/* Line */}
          <div
            style={{
              position: 'absolute',
              top: `${currentPixelPosition}px`,
              left: 0,
              right: 0,
              height: '2px',
              background: 'var(--color-accent-teal)',
              zIndex: 50,
              boxShadow: '0 0 8px rgba(0,229,200,0.4)',
            }}
          />
          {/* Dot */}
          <div
            style={{
              position: 'absolute',
              top: `${currentPixelPosition - 4}px`,
              right: '6px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--color-accent-teal)',
              zIndex: 51,
            }}
          />
        </>
      )}
    </div>
  );
};
