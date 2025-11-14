'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/performance';

/**
 * Web Vitals Component
 * 
 * Tracks and reports Core Web Vitals metrics using the Next.js built-in
 * web vitals reporting. This component should be included in the root layout.
 */
export function WebVitals() {
  useEffect(() => {
    // Only track in browser
    if (typeof window === 'undefined') return;

    // Track page visibility changes
    let isVisible = !document.hidden;
    
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Use Next.js built-in web vitals if available
    if ('PerformanceObserver' in window) {
      try {
        // Observe Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          if (lastEntry && isVisible) {
            reportWebVitals({
              name: 'LCP',
              value: lastEntry.renderTime || lastEntry.loadTime,
              rating: lastEntry.renderTime || lastEntry.loadTime <= 2500 ? 'good' : 
                      lastEntry.renderTime || lastEntry.loadTime <= 4000 ? 'needs-improvement' : 'poor',
              id: `v1-${Date.now()}-${Math.random()}`,
            });
          }
        });
        
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // Observe First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (isVisible) {
              reportWebVitals({
                name: 'FID',
                value: entry.processingStart - entry.startTime,
                rating: entry.processingStart - entry.startTime <= 100 ? 'good' :
                        entry.processingStart - entry.startTime <= 300 ? 'needs-improvement' : 'poor',
                id: `v1-${Date.now()}-${Math.random()}`,
              });
            }
          });
        });
        
        fidObserver.observe({ type: 'first-input', buffered: true });

        // Observe Cumulative Layout Shift (CLS)
        let clsValue = 0;
        let clsEntries: any[] = [];
        
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              clsEntries.push(entry);
            }
          });
          
          if (isVisible) {
            reportWebVitals({
              name: 'CLS',
              value: clsValue,
              rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
              id: `v1-${Date.now()}-${Math.random()}`,
            });
          }
        });
        
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // Observe First Contentful Paint (FCP)
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint' && isVisible) {
              reportWebVitals({
                name: 'FCP',
                value: entry.startTime,
                rating: entry.startTime <= 1800 ? 'good' :
                        entry.startTime <= 3000 ? 'needs-improvement' : 'poor',
                id: `v1-${Date.now()}-${Math.random()}`,
              });
            }
          });
        });
        
        fcpObserver.observe({ type: 'paint', buffered: true });

        // Observe Time to First Byte (TTFB)
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.responseStart && isVisible) {
              const ttfb = entry.responseStart - entry.requestStart;
              reportWebVitals({
                name: 'TTFB',
                value: ttfb,
                rating: ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor',
                id: `v1-${Date.now()}-${Math.random()}`,
              });
            }
          });
        });
        
        navigationObserver.observe({ type: 'navigation', buffered: true });

        // Cleanup
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
          fcpObserver.disconnect();
          navigationObserver.disconnect();
        };
      } catch (error) {
        // PerformanceObserver not supported or error occurred
        console.warn('Performance monitoring not available:', error);
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
}
