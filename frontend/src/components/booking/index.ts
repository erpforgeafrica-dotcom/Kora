/**
 * Booking Command Center - Barrel export
 * Enterprise-grade operations dashboard components
 */

export { default as OperationsCommandCenter } from './OperationsCommandCenter';
export { CalendarGrid, type CalendarAppointment } from './CalendarGrid';
export { TimeColumn } from './TimeColumn';
export { StaffColumn, type StaffColumnAppointment } from './StaffColumn';
export { AppointmentBlock, type AppointmentBlockData } from './AppointmentBlock';
export { OperationsMetricsBar, type Metric } from './OperationsMetricsBar';
export { OperationsRightPanel } from './OperationsRightPanel';
export { OperationsAnalyticsStrip, type RevenueDataPoint, type StaffCapacity, type TopService } from './OperationsAnalyticsStrip';

// Calendar utilities
export * from './calendarEngine';
