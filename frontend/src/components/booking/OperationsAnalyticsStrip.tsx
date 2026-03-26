/**
 * OperationsAnalyticsStrip — Bottom analytics row
 * Shows revenue sparkline, staff capacity, and top services
 */

import React from 'react';

export interface RevenueDataPoint {
  time: string; // "09:00", "10:00", etc.
  value: number;
}

export interface StaffCapacity {
  staffName: string;
  utilizationPercent: number;
}

export interface TopService {
  serviceName: string;
  count: number;
}

interface OperationsAnalyticsStripProps {
  revenueData?: RevenueDataPoint[];
  staffCapacity?: StaffCapacity[];
  topServices?: TopService[];
}

// Simple sparkline SVG renderer
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length < 2) {
    return (
      <svg width="100%" height="40" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
        <text x="50%" y="20" textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="11">
          No data
        </text>
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 40;
  const padding = 4;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="100%" height="40" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <polyline points={points} fill={color} fillOpacity="0.1" stroke="none" />
    </svg>
  );
};

export const OperationsAnalyticsStrip: React.FC<OperationsAnalyticsStripProps> = ({
  revenueData = [
    { time: '09:00', value: 220 },
    { time: '10:00', value: 450 },
    { time: '11:00', value: 380 },
    { time: '12:00', value: 290 },
    { time: '13:00', value: 620 },
    { time: '14:00', value: 550 },
    { time: '15:00', value: 720 },
    { time: '16:00', value: 680 },
  ],
  staffCapacity = [
    { staffName: 'Ada', utilizationPercent: 92 },
    { staffName: 'Mira', utilizationPercent: 75 },
    { staffName: 'James', utilizationPercent: 68 },
  ],
  topServices = [
    { serviceName: 'Balayage', count: 8 },
    { serviceName: 'Deep Tissue', count: 6 },
    { serviceName: 'Haircut', count: 5 },
  ],
}) => {
  const revenueValues = revenueData.map(d => d.value);
  const totalRevenue = revenueValues.reduce((a, b) => a + b, 0);

  const getCapacityColor = (percent: number) => {
    if (percent >= 85) return '#10b981'; // green
    if (percent >= 70) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '16px',
        padding: '16px',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-background-secondary)',
        fontSize: '12px',
      }}
    >
      {/* Revenue Sparkline */}
      <div>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          Revenue Today
        </div>
        <Sparkline data={revenueValues} color="var(--color-success)" />
        <div
          style={{
            marginTop: '8px',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-success)',
          }}
        >
          £{totalRevenue.toLocaleString('en-GB')}
        </div>
      </div>

      {/* Staff Capacity */}
      <div>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          Staff Utilization
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {staffCapacity.map(staff => (
            <div key={staff.staffName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '60px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {staff.staffName}
              </div>

              {/* Capacity bar */}
              <div
                style={{
                  flex: 1,
                  height: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${staff.utilizationPercent}%`,
                    background: getCapacityColor(staff.utilizationPercent),
                    transition: 'width 0.5s ease-out',
                    borderRadius: '3px',
                  }}
                />
              </div>

              <div
                style={{
                  width: '28px',
                  textAlign: 'right',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: getCapacityColor(staff.utilizationPercent),
                }}
              >
                {staff.utilizationPercent}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Services */}
      <div>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          Top Services
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {topServices.map((service, idx) => (
            <div key={service.serviceName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {idx + 1}. {service.serviceName}
              </span>
              <span style={{ fontWeight: 700, color: 'var(--color-accent-teal)' }}>
                {service.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
