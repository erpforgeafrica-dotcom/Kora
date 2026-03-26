/**
 * OperationsMetricsBar — Top KPI metrics with trend indicators
 * Displays real-time operational dashboards
 */

import React, { useState, useEffect } from 'react';

export interface Metric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: number; // percentage change, positive = up
  format?: 'number' | 'currency' | 'percentage';
  color?: 'teal' | 'green' | 'amber' | 'red' | 'blue';
}

interface OperationsMetricsBarProps {
  metrics: Metric[];
  onMetricClick?: (metricId: string) => void;
  isLoading?: boolean;
}

export const OperationsMetricsBar: React.FC<OperationsMetricsBarProps> = ({
  metrics,
  onMetricClick,
  isLoading = false,
}) => {
  const [animatingMetrics, setAnimatingMetrics] = useState<Set<string>>(new Set());

  const formatValue = (metric: Metric): string => {
    switch (metric.format) {
      case 'currency':
        return `£${typeof metric.value === 'number' ? metric.value.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : metric.value}`;
      case 'percentage':
        return `${metric.value}%`;
      default:
        return String(metric.value);
    }
  };

  const getColorScheme = (color?: string) => {
    switch (color) {
      case 'green':
        return { primary: '#10b981', dark: '#047857' };
      case 'amber':
        return { primary: '#f59e0b', dark: '#d97706' };
      case 'red':
        return { primary: '#ef4444', dark: '#dc2626' };
      case 'blue':
        return { primary: '#3b82f6', dark: '#1d4ed8' };
      default:
        return { primary: 'var(--color-accent-teal)', dark: '#0d9488' };
    }
  };

  const getTrendIcon = (trend?: number) => {
    if (!trend) return '–';
    return trend > 0 ? '▲' : '▼';
  };

  const getTrendColor = (trend?: number) => {
    if (!trend) return 'var(--color-text-tertiary)';
    return trend > 0 ? '#10b981' : '#ef4444';
  };

  useEffect(() => {
    // Animate on initial load
    const newAnimating = new Set(metrics.map(m => m.id));
    setAnimatingMetrics(newAnimating);
  }, [metrics]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`,
        gap: '12px',
        padding: '16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-background-card)',
      }}
    >
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .metric-card-animating {
          animation: slideInUp 0.5s ease-out;
        }

        .metric-skeleton {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      {metrics.map((metric) => {
        const colors = getColorScheme(metric.color);
        const isAnimating = animatingMetrics.has(metric.id);

        return (
          <div
            key={metric.id}
            onClick={() => onMetricClick?.(metric.id)}
            className={isAnimating ? 'metric-card-animating' : ''}
            style={{
              padding: '14px',
              background: isLoading
                ? 'rgba(255,255,255,0.03)'
                : `linear-gradient(135deg, ${colors.primary}08, transparent)`,
              border: `1px solid ${colors.primary}20`,
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.3s ease-out',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 20px ${colors.primary}20`;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            }}
          >
            {/* Label */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '6px',
              }}
            >
              {metric.label}
            </div>

            {/* Value and Trend */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              {isLoading ? (
                <div
                  className="metric-skeleton"
                  style={{
                    height: '20px',
                    width: '60%',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                  }}
                />
              ) : (
                <>
                  <div
                    style={{
                      fontSize: '22px',
                      fontWeight: 700,
                      color: colors.primary,
                    }}
                  >
                    {formatValue(metric)}
                  </div>

                  {metric.trend !== undefined && (
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: getTrendColor(metric.trend),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      {getTrendIcon(metric.trend)}
                      {Math.abs(metric.trend)}%
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Trend text */}
            {!isLoading && metric.trend !== undefined && (
              <div
                style={{
                  fontSize: '9px',
                  color: getTrendColor(metric.trend),
                  fontWeight: 600,
                }}
              >
                {metric.trend > 0 ? 'vs yesterday' : 'vs last week'}
              </div>
            )}

            {/* Optional unit */}
            {metric.unit && !isLoading && (
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '4px',
                }}
              >
                {metric.unit}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
