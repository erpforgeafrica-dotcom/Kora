/**
 * Performance Monitoring Utility
 * Tracks Web Vitals and custom metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
    this.initializeWebVitals();
  }

  private initializeWebVitals() {
    if (!this.enabled || typeof window === 'undefined') return;

    // Measure First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.recordMetric('FCP', entry.startTime, 'ms');
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('PerformanceObserver not supported');
      }
    }

    // Measure Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime || 0, 'ms');
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }
    }

    // Measure Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.recordMetric('CLS', clsValue, 'score');
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }

    // Measure Time to Interactive
    window.addEventListener('load', () => {
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        const tti = navigationTiming.domInteractive;
        this.recordMetric('TTI', tti, 'ms');
      }
    });
  }

  recordMetric(name: string, value: number, unit: string = 'ms') {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      value: Math.round(value * 100) / 100,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${metric.value}${unit}`);
    }

    // Send to analytics in production
    if (import.meta.env.PROD) {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to your analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
      });
    }
  }

  measureRouteChange(routeName: string) {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.recordMetric(`Route: ${routeName}`, endTime - startTime, 'ms');
    };
  }

  measureAPICall(endpoint: string) {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.recordMetric(`API: ${endpoint}`, endTime - startTime, 'ms');
    };
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return Math.round((sum / metrics.length) * 100) / 100;
  }

  clear() {
    this.metrics = [];
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}

export const performanceMonitor = new PerformanceMonitor(
  import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING !== 'false'
);
