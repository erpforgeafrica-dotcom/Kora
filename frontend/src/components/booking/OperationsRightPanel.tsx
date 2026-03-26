/**
 * OperationsRightPanel — Quick actions, check-in queue, and AI suggestions
 * Right column of the Operations Command Center
 */

import React, { useState } from 'react';

interface CheckInQueueItem {
  clientName: string;
  appointmentTime: string;
  status: 'arrived' | 'waiting' | 'ready';
}

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
  isHovered?: boolean;
}

interface AISuggestion {
  id: string;
  type: 'capacity' | 'promotion' | 'conflict' | 'recommendation';
  title: string;
  description: string;
  action?: string;
  severity?: 'info' | 'warning' | 'critical';
}

interface OperationsRightPanelProps {
  checkInQueue: CheckInQueueItem[];
  suggestions: AISuggestion[];
  onAction: (actionId: string) => void;
  onSuggestionAction?: (suggestionId: string) => void;
  onCheckInClick?: (clientName: string) => void;
}

export const OperationsRightPanel: React.FC<OperationsRightPanelProps> = ({
  checkInQueue,
  suggestions,
  onAction,
  onSuggestionAction,
  onCheckInClick,
}) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  const quickActions: QuickAction[] = [
    { id: 'new-booking', label: '+ New Booking', icon: '📅', variant: 'primary', onClick: () => onAction('new-booking') },
    { id: 'check-in', label: '✔ Check-in Client', icon: '', variant: 'primary', onClick: () => onAction('check-in') },
    { id: 'mark-complete', label: '✓ Mark Complete', icon: '', variant: 'secondary', onClick: () => onAction('mark-complete') },
    { id: 'reschedule', label: '↺ Reschedule', icon: '', variant: 'secondary', onClick: () => onAction('reschedule') },
    { id: 'email-confirmations', label: '✉ Email Confirmations', icon: '', variant: 'tertiary', onClick: () => onAction('email-confirmations') },
  ];

  const getSuggestionColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444'; // red
      case 'warning':
        return '#f59e0b'; // amber
      default:
        return '#00e5c8'; // teal
    }
  };

  const getSuggestionBg = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'rgba(239, 68, 68, 0.08)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.08)';
      default:
        return 'rgba(0, 229, 200, 0.08)';
    }
  };

  return (
    <div
      style={{
        width: '320px',
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-background-card)',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--color-text-primary)',
      }}
    >
      {/* Quick Actions Section */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Quick Actions
        </div>

        {/* Primary actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
          {quickActions.filter(a => a.variant === 'primary').map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              style={{
                padding: '12px',
                background: 'var(--color-accent-teal)',
                color: 'var(--color-background-dark)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
                transform: 'translateY(0)',
                boxShadow: '0 2px 6px rgba(0,229,200,0.15)',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(0,229,200,0.25)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 2px 6px rgba(0,229,200,0.15)';
              }}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Secondary actions */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {quickActions.filter(a => a.variant === 'secondary').map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              style={{
                flex: 1,
                padding: '10px',
                background: 'rgba(0,229,200,0.1)',
                color: 'var(--color-accent-teal)',
                border: '1px solid rgba(0,229,200,0.2)',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(0,229,200,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(0,229,200,0.1)';
              }}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Tertiary actions */}
        <div>
          {quickActions.filter(a => a.variant === 'tertiary').map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              style={{
                width: '100%',
                padding: '8px',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Check-in Queue Section */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', maxHeight: '240px', overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Check-in Queue
        </div>

        {checkInQueue.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', padding: '16px', textAlign: 'center' }}>
            No clients to check in
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {checkInQueue.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  background:
                    item.status === 'arrived'
                      ? 'rgba(0,229,200,0.08)'
                      : item.status === 'waiting'
                        ? 'rgba(245,158,11,0.08)'
                        : 'rgba(16,185,129,0.08)',
                  border:
                    item.status === 'arrived'
                      ? '1px solid rgba(0,229,200,0.2)'
                      : item.status === 'waiting'
                        ? '1px solid rgba(245,158,11,0.2)'
                        : '1px solid rgba(16,185,129,0.2)',
                  borderLeft:
                    item.status === 'arrived'
                      ? '3px solid var(--color-accent-teal)'
                      : item.status === 'waiting'
                        ? '3px solid #f59e0b'
                        : '3px solid #10b981',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateX(2px)';
                  el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = 'translateX(0)';
                  el.style.boxShadow = 'none';
                }}
                onClick={() => onCheckInClick?.(item.clientName)}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '2px' }}>
                  {item.clientName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  {item.appointmentTime}
                </div>
                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '9px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color:
                      item.status === 'arrived'
                        ? 'var(--color-accent-teal)'
                        : item.status === 'waiting'
                          ? '#f59e0b'
                          : '#10b981',
                    letterSpacing: '0.05em',
                  }}
                >
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Suggestions Section */}
      <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          AI Suggestions
        </div>

        {suggestions.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '16px' }}>
            No suggestions at this time
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {suggestions.map(suggestion => (
              <div
                key={suggestion.id}
                onClick={() => setExpandedSuggestion(expandedSuggestion === suggestion.id ? null : suggestion.id)}
                style={{
                  padding: '12px',
                  background: getSuggestionBg(suggestion.severity),
                  border: `1px solid rgba(0,0,0,0.2)`,
                  borderLeft: `3px solid ${getSuggestionColor(suggestion.severity)}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: getSuggestionColor(suggestion.severity), marginBottom: '4px' }}>
                  {suggestion.title}
                </div>

                {expandedSuggestion === suggestion.id && (
                  <>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                      {suggestion.description}
                    </div>

                    {suggestion.action && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSuggestionAction?.(suggestion.id);
                        }}
                        style={{
                          width: '100%',
                          padding: '6px',
                          background: getSuggestionColor(suggestion.severity),
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}
                      >
                        {suggestion.action}
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
