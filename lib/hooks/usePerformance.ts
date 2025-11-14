import { useEffect, useRef, useCallback } from 'react';
import { trackRender, trackInteraction, measureAsync } from '@/lib/performance';

/**
 * Hook to track component render counts in development
 */
export function useRenderTracking(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    trackRender(componentName);
  }
}

/**
 * Hook to measure interaction performance
 */
export function useInteractionTracking() {
  const trackClick = useCallback((label: string) => {
    const startTime = performance.now();
    return () => trackInteraction(label, startTime);
  }, []);

  const trackAsync = useCallback(async <T,>(
    label: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    return measureAsync(label, operation);
  }, []);

  return { trackClick, trackAsync };
}

/**
 * Hook to track component mount/unmount timing
 */
export function useComponentTiming(componentName: string) {
  const mountTime = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ [Performance] ${componentName} mounted`);
    }

    return () => {
      const lifetime = performance.now() - mountTime.current;
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ [Performance] ${componentName} unmounted after ${lifetime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
}

/**
 * Hook to warn about slow renders
 */
export function useRenderPerformance(componentName: string, threshold = 16) {
  const renderStart = useRef<number>(0);

  if (process.env.NODE_ENV === 'development') {
    renderStart.current = performance.now();
  }

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const renderTime = performance.now() - renderStart.current;
      
      if (renderTime > threshold) {
        console.warn(
          `🐌 [Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
        );
      }
    }
  });
}
