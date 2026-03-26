import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { StaffUtilisation } from '../hooks/useBusinessMetrics';

interface StaffPerformanceDrawerProps {
  staff: StaffUtilisation;
  onClose: () => void;
}

export default function StaffPerformanceDrawer({ staff, onClose }: StaffPerformanceDrawerProps) {
  // Mock detailed data with revenue trend
  const revenuetrend = [
    { date: 'Mon', revenue: 240 },
    { date: 'Tue', revenue: 280 },
    { date: 'Wed', revenue: 320 },
    { date: 'Thu', revenue: 290 },
    { date: 'Fri', revenue: 350 },
    { date: 'Sat', revenue: 410 },
    { date: 'Sun', revenue: 310 },
  ];

  const topServices = [
    { service: 'Massage Therapy', frequency: 12, revenue: 480 },
    { service: 'Facials', frequency: 8, revenue: 320 },
    { service: 'Hair Care', frequency: 5, revenue: 150 },
  ];

  const availability = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 8 }, (_, slot) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day],
      slot: `${9 + slot}:00`,
      booked: Math.random() > 0.4,
    }))
  ).flat();

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: 480,
        background: 'var(--color-background-card)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.3)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {staff.name}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-tertiary)', textTransform: 'capitalize' }}>
            {staff.role}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            color: 'var(--color-text-tertiary)',
            cursor: 'pointer',
            padding: '0',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div style={{
            padding: 12,
            background: 'rgba(0, 229, 200, 0.08)',
            border: '1px solid rgba(0, 229, 200, 0.2)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>BOOKINGS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-accent-teal)', marginTop: 4 }}>
              {staff.bookings_this_week}
            </div>
          </div>
          <div style={{
            padding: 12,
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>REVENUE</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>
              £{staff.revenue_this_week}
            </div>
          </div>
          <div style={{
            padding: 12,
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>RATING</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
              4.8★
            </div>
          </div>
          <div style={{
            padding: 12,
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>RETENTION</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981', marginTop: 4 }}>
              {staff.utilisation_pct}%
            </div>
          </div>
        </div>

        {/* Revenue Trend */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 12px' }}>
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenuetrend}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent-teal)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-accent-teal)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-text-tertiary)" style={{ fontSize: 11 }} />
              <YAxis stroke="var(--color-text-tertiary)" style={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-background-dark)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-accent-teal)"
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Services */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 12px' }}>
            Top Services
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topServices.map((svc, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {svc.service}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                    {svc.frequency} bookings · £{svc.revenue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Availability Grid */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 12px' }}>
            This Week's Availability
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {availability.slice(0, 28).map((slot, i) => (
              <div
                key={i}
                style={{
                  padding: '6px',
                  background: slot.booked ? 'rgba(255,255,255,0.05)' : 'rgba(0, 229, 200, 0.1)',
                  border: slot.booked ? '1px solid var(--color-border)' : '1px solid var(--color-accent-teal)',
                  borderRadius: 4,
                  fontSize: 9,
                  color: slot.booked ? 'var(--color-text-tertiary)' : 'var(--color-accent-teal)',
                  textAlign: 'center',
                  opacity: slot.booked ? 0.5 : 1,
                }}
              >
                {slot.slot}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
