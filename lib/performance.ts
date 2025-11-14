/**
 * Performance Monitoring Utilities
 * 
 * Provides utilities for tracking performance metrics, Core Web Vitals,
 * and component render counts in development.
 */

// Core Web Vitals thresholds (in milliseconds)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

type MetricName = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
type MetricRating = 'good' | 'needs-improvement' | 'poor';

interface PerformanceMetric {
  name: MetricName;
  value: number;
  rating: MetricRating;
  delta?: number;
  id: string;
  navigationType?: string;
}

interface UserInteractionTiming {
  action: string;
  duration: number;
  timestamp: number;
}

// Store performance metrics
const metrics: PerformanceMetric[] = [];
const interactions: UserInteractionTiming[] = [];

/**
 * Get rating for a metric based on its value
 */
function getMetricRating(name: MetricName, value: number): MetricRating {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Log a performance metric
 */
function logMetric(metric: PerformanceMetric) {
  metrics.push(metric);
  
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(
      `${emoji} [Performance] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`
    );
  }
  
  // In production, you might want to send this to an analytics service
  if (typeof window !== 'undefined' && !isDev) {
    // Example: Send to analytics
    // analytics.track('web-vital', metric);
  }
}

/**
 * Report Core Web Vitals using the web-vitals library pattern
 */
export function reportWebVitals(metric: PerformanceMetric) {
  logMetric(metric);
}

/**
 * Track user interaction timing
 */
export function trackInteraction(action: string, startTime: number) {
  const duration = performance.now() - startTime;
  const interaction: UserInteractionTiming = {
    action,
    duration,
    timestamp: Date.now(),
  };
  
  interactions.push(interaction);
  
  const isDev = process.env.NODE_ENV === 'development';
  
  // Warn if interaction is slow
  if (duration > 100) {
    const emoji = duration > 300 ? '🐌' : '⚠️';
    if (isDev) {
      console.warn(
        `${emoji} [Performance] Slow interaction: ${action} took ${duration.toFixed(2)}ms`
      );
    }
  } else if (isDev) {
    console.log(`⚡ [Performance] ${action} completed in ${duration.toFixed(2)}ms`);
  }
  
  return duration;
}

/**
 * Measure the performance of an async operation
 */
export async function measureAsync<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    trackInteraction(label, startTime);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ [Performance] ${label} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Measure the performance of a synchronous operation
 */
export function measureSync<T>(label: string, operation: () => T): T {
  const startTime = performance.now();
  
  try {
    const result = operation();
    trackInteraction(label, startTime);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ [Performance] ${label} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Create a performance mark
 */
export function mark(name: string) {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure between two performance marks
 */
export function measure(name: string, startMark: string, endMark: string) {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      
      if (measure && process.env.NODE_ENV === 'development') {
        console.log(`📊 [Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
      }
      
      return measure?.duration;
    } catch (error) {
      // Marks might not exist, ignore
    }
  }
  return 0;
}

/**
 * Get all recorded metrics
 */
export function getMetrics(): PerformanceMetric[] {
  return [...metrics];
}

/**
 * Get all recorded interactions
 */
export function getInteractions(): UserInteractionTiming[] {
  return [...interactions];
}

/**
 * Clear all recorded metrics and interactions
 */
export function clearMetrics() {
  metrics.length = 0;
  interactions.length = 0;
}

/**
 * Get performance summary
 */
export function getPerformanceSummary() {
  const summary = {
    metrics: metrics.reduce((acc, metric) => {
      acc[metric.name] = {
        value: metric.value,
        rating: metric.rating,
      };
      return acc;
    }, {} as Record<string, { value: number; rating: MetricRating }>),
    interactions: {
      total: interactions.length,
      slow: interactions.filter(i => i.duration > 100).length,
      average: interactions.length > 0
        ? interactions.reduce((sum, i) => sum + i.duration, 0) / interactions.length
        : 0,
    },
  };
  
  return summary;
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary() {
  if (process.env.NODE_ENV !== 'development') return;
  
  const summary = getPerformanceSummary();
  
  console.group('📊 Performance Summary');
  
  console.group('Core Web Vitals');
  Object.entries(summary.metrics).forEach(([name, data]) => {
    const emoji = data.rating === 'good' ? '✅' : data.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${name}: ${data.value.toFixed(2)}ms (${data.rating})`);
  });
  console.groupEnd();
  
  console.group('User Interactions');
  console.log(`Total: ${summary.interactions.total}`);
  console.log(`Slow (>100ms): ${summary.interactions.slow}`);
  console.log(`Average: ${summary.interactions.average.toFixed(2)}ms`);
  console.groupEnd();
  
  console.groupEnd();
}

// Development-only: Track component renders
let renderCounts: Map<string, number> | null = null;

/**
 * Track component render count (development only)
 */
export function trackRender(componentName: string) {
  if (process.env.NODE_ENV !== 'development') return;
  
  if (!renderCounts) {
    renderCounts = new Map();
  }
  
  const count = (renderCounts.get(componentName) || 0) + 1;
  renderCounts.set(componentName, count);
  
  // Warn if component renders too frequently
  if (count > 10 && count % 5 === 0) {
    console.warn(
      `🔄 [Performance] ${componentName} has rendered ${count} times. Consider memoization.`
    );
  }
}

/**
 * Get render counts for all tracked components
 */
export function getRenderCounts(): Record<string, number> {
  if (!renderCounts) return {};
  return Object.fromEntries(renderCounts.entries());
}

/**
 * Log render counts to console
 */
export function logRenderCounts() {
  if (process.env.NODE_ENV !== 'development' || !renderCounts) return;
  
  const counts = getRenderCounts();
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  if (entries.length === 0) return;
  
  console.group('🔄 Component Render Counts');
  entries.forEach(([name, count]) => {
    const emoji = count > 20 ? '🔴' : count > 10 ? '🟡' : '🟢';
    console.log(`${emoji} ${name}: ${count} renders`);
  });
  console.groupEnd();
}

/**
 * Clear render counts
 */
export function clearRenderCounts() {
  if (renderCounts) {
    renderCounts.clear();
  }
}

/**
 * Hook to track component renders
 */
export function useRenderTracking(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    trackRender(componentName);
  }
}
