/**
 * OperationsCommandCenter — World-class booking operations dashboard
 * 3-zone command center: metrics + timeline + operations + analytics
 * Replaces StaffWorkspace with enterprise-grade operations interface
 */

import React, { useState, useEffect } from 'react';
import { CalendarGrid, type StaffMember, type CalendarAppointment } from './CalendarGrid';
import { OperationsMetricsBar, type Metric } from './OperationsMetricsBar';
import { OperationsRightPanel } from './OperationsRightPanel';
import { OperationsAnalyticsStrip, type RevenueDataPoint, type StaffCapacity, type TopService } from './OperationsAnalyticsStrip';

// Mock data generation
const generateMockAppointments = (): CalendarAppointment[] => [
  {
    id: 'apt-001',
    staffId: 'staff-1',
    clientName: 'Sarah Chen',
    clientInitial: 'S',
    serviceName: 'Balayage Refresh',
    serviceDuration: 120,
    price: 220,
    status: 'confirmed',
    startMinutes: 9 * 60,
    endMinutes: 11 * 60,
  },
  {
    id: 'apt-002',
    staffId: 'staff-1',
    clientName: 'Emma Wilson',
    clientInitial: 'E',
    serviceName: 'Deep Tissue Massage',
    serviceDuration: 60,
    price: 135,
    status: 'checked_in',
    startMinutes: 11 * 60 + 30,
    endMinutes: 12 * 60 + 30,
  },
  {
    id: 'apt-003',
    staffId: 'staff-2',
    clientName: 'Marcus Johnson',
    clientInitial: 'M',
    serviceName: 'Haircut & Styling',
    serviceDuration: 45,
    price: 85,
    status: 'in_progress',
    startMinutes: 10 * 60,
    endMinutes: 10 * 60 + 45,
  },
  {
    id: 'apt-004',
    staffId: 'staff-2',
    clientName: 'Zainab Williams',
    clientInitial: 'Z',
    serviceName: 'Facial Treatment',
    serviceDuration: 60,
    price: 95,
    status: 'confirmed',
    startMinutes: 13 * 60,
    endMinutes: 14 * 60,
  },
  {
    id: 'apt-005',
    staffId: 'staff-3',
    clientName: 'Lisa Chen',
    clientInitial: 'L',
    serviceName: 'Manicure',
    serviceDuration: 45,
    price: 45,
    status: 'completed',
    startMinutes: 9 * 60 + 30,
    endMinutes: 10 * 60 + 15,
  },
  {
    id: 'apt-006',
    staffId: 'staff-3',
    clientName: 'David Kim',
    clientInitial: 'D',
    serviceName: 'Pedicure',
    serviceDuration: 45,
    price: 55,
    status: 'confirmed',
    startMinutes: 14 * 60,
    endMinutes: 14 * 60 + 45,
  },
];

const generateMockStaff = (): StaffMember[] => [
  { id: 'staff-1', name: 'Ada Nwosu', availability: 'available' },
  { id: 'staff-2', name: 'Mira Patel', availability: 'available' },
  { id: 'staff-3', name: 'James Foster', availability: 'busy' },
];

export interface OperationsCommandCenterProps {
  organizationId?: string;
}

export default function OperationsCommandCenter(props: OperationsCommandCenterProps) {
  const [staff, setStaff] = useState<StaffMember[]>(generateMockStaff());
  const [appointments, setAppointments] = useState<CalendarAppointment[]>(generateMockAppointments());
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock metrics
  const metrics: Metric[] = [
    {
      id: 'bookings-today',
      label: 'Today\'s Bookings',
      value: 34,
      trend: 12,
      color: 'teal',
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: 4820,
      format: 'currency',
      trend: 18,
      color: 'green',
    },
    {
      id: 'capacity',
      label: 'Capacity',
      value: 85,
      format: 'percentage',
      trend: -3,
      color: 'amber',
    },
    {
      id: 'check-ins',
      label: 'Pending Check-ins',
      value: 8,
      color: 'blue',
    },
    {
      id: 'no-shows',
      label: 'No Shows',
      value: 2,
      trend: 5,
      color: 'red',
    },
  ];

  const checkInQueue = [
    { clientName: 'Emma Patel', appointmentTime: '11:45', status: 'arrived' as const },
    { clientName: 'David Kim', appointmentTime: '12:00', status: 'waiting' as const },
  ];

  const suggestions = [
    {
      id: 'sugg-1',
      type: 'capacity' as const,
      title: 'Open Slots Available',
      description: 'You have 2 open slots at 15:30 today. Consider sending a promotion to nearby customers.',
      action: 'Send Promotion',
      severity: 'info' as const,
    },
    {
      id: 'sugg-2',
      type: 'conflict' as const,
      title: 'Stylist Ada Overbooked',
      description: 'Ada has back-to-back appointments with minimal break time. Consider moving one appointment to Mira Cole.',
      action: 'Reschedule',
      severity: 'warning' as const,
    },
    {
      id: 'sugg-3',
      type: 'recommendation' as const,
      title: 'Prepare Client Brief',
      description: 'Sarah Chen\'s appointment in 30 minutes. Brief ready for preparation.',
      severity: 'info' as const,
    },
  ];

  const revenueData: RevenueDataPoint[] = [
    { time: '09:00', value: 220 },
    { time: '10:00', value: 450 },
    { time: '11:00', value: 380 },
    { time: '12:00', value: 290 },
    { time: '13:00', value: 620 },
    { time: '14:00', value: 550 },
    { time: '15:00', value: 720 },
    { time: '16:00', value: 680 },
  ];

  const staffCapacity: StaffCapacity[] = [
    { staffName: 'Ada', utilizationPercent: 92 },
    { staffName: 'Mira', utilizationPercent: 75 },
    { staffName: 'James', utilizationPercent: 68 },
  ];

  const topServices: TopService[] = [
    { serviceName: 'Balayage', count: 8 },
    { serviceName: 'Deep Tissue', count: 6 },
    { serviceName: 'Haircut', count: 5 },
  ];

  // Handle global search
  const handleGlobalSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search across appointments and staff
  };

  // Handle quick actions
  const handleQuickAction = (actionId: string) => {
    switch (actionId) {
      case 'new-booking':
        console.log('Opening new booking modal...');
        // TODO: Open modal to create new booking
        break;
      case 'check-in':
        console.log('Opening check-in dialog...');
        // TODO: Open check-in modal
        break;
      case 'mark-complete':
        if (selectedAppointmentId) {
          setAppointments(prev =>
            prev.map(apt =>
              apt.id === selectedAppointmentId
                ? { ...apt, status: 'completed' as const }
                : apt
            )
          );
        }
        break;
      case 'reschedule':
        console.log('Opening reschedule dialog...');
        // TODO: Open reschedule modal
        break;
      case 'email-confirmations':
        console.log('Sending confirmation emails...');
        // TODO: Trigger email sending
        break;
      case 'support-intervention':
        window.open('/app/operations/support', '_blank');
        break;
    }
  };

  const handleSuggestionAction = (suggestionId: string) => {
    console.log('Acting on suggestion:', suggestionId);
    // TODO: Implement suggestion actions
  };

  const handleAppointmentSelect = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
  };

  // Simulate metric refresh
  const handleMetricClick = (metricId: string) => {
    setMetricsLoading(true);
    setTimeout(() => setMetricsLoading(false), 1000);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--color-background-dark)',
        color: 'var(--color-text-primary)',
        fontFamily: 'inherit',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-background-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* Left: Title */}
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
          Operations Command
        </h1>

        {/* Center: Global search */}
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          >
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search bookings, clients, services..."
              value={searchQuery}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                outline: 'none',
                fontSize: 'inherit',
              }}
            />
            <span style={{ color: 'var(--color-text-tertiary)' }}>⌘K</span>
          </div>
        </div>

        {/* Right: Organization + Notifications + Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            style={{
              padding: '6px 12px',
              background: 'rgba(0,229,200,0.1)',
              border: '1px solid rgba(0,229,200,0.2)',
              borderRadius: '6px',
              color: 'var(--color-accent-teal)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Demo Organization ▼
          </button>
          <div style={{ fontSize: '16px', cursor: 'pointer' }}>🔔</div>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--color-accent-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-background-dark)',
              cursor: 'pointer',
            }}
          >
            A
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <OperationsMetricsBar
        metrics={metrics}
        isLoading={metricsLoading}
        onMetricClick={handleMetricClick}
      />

      {/* Main Content: Calendar + Right Panel */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Calendar Grid (left/center) */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <CalendarGrid
            staff={staff}
            appointments={appointments}
            startHour={9}
            endHour={18}
            selectedAppointmentId={selectedAppointmentId}
            onAppointmentSelect={handleAppointmentSelect}
            showConflicts={true}
          />
        </div>

        {/* Operations Right Panel */}
        <OperationsRightPanel
          checkInQueue={checkInQueue}
          suggestions={suggestions}
          onAction={handleQuickAction}
          onSuggestionAction={handleSuggestionAction}
        />
      </div>

      {/* Analytics Strip (bottom) */}
      <OperationsAnalyticsStrip
        revenueData={revenueData}
        staffCapacity={staffCapacity}
        topServices={topServices}
      />
    </div>
  );
}
