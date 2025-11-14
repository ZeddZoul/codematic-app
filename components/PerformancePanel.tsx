'use client';

import { useEffect, useState } from 'react';
import {
  getPerformanceSummary,
  getRenderCounts,
  logPerformanceSummary,
  logRenderCounts,
} from '@/lib/performance';

/**
 * Performance Panel Component (Development Only)
 * 
 * Displays performance metrics and render counts in development mode.
 * Can be toggled with Ctrl+Shift+P keyboard shortcut.
 */
export function PerformancePanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [summary, setSummary] = useState<ReturnType<typeof getPerformanceSummary> | null>(null);
  const [renderCounts, setRenderCounts] = useState<Record<string, number>>({});

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    // Keyboard shortcut to toggle panel (Ctrl+Shift+P)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(prev => !prev);
        
        if (!isVisible) {
          // Refresh data when opening
          setSummary(getPerformanceSummary());
          setRenderCounts(getRenderCounts());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    // Update data every 2 seconds when visible
    const interval = setInterval(() => {
      setSummary(getPerformanceSummary());
      setRenderCounts(getRenderCounts());
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg opacity-50 hover:opacity-100 transition-opacity">
        Press <kbd className="bg-gray-700 px-1 rounded">Ctrl+Shift+P</kbd> for performance panel
      </div>
    );
  }

  const renderCountEntries = Object.entries(renderCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-2xl w-96 max-h-[600px] overflow-hidden flex flex-col z-50">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h3 className="font-semibold">Performance Monitor</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-4 space-y-4">
        {/* Core Web Vitals */}
        {summary && Object.keys(summary.metrics).length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-sm text-gray-300">Core Web Vitals</h4>
            <div className="space-y-2">
              {Object.entries(summary.metrics).map(([name, data]) => {
                const emoji = data.rating === 'good' ? '✅' : 
                             data.rating === 'needs-improvement' ? '⚠️' : '❌';
                const color = data.rating === 'good' ? 'text-green-400' : 
                             data.rating === 'needs-improvement' ? 'text-yellow-400' : 'text-red-400';
                
                return (
                  <div key={name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{emoji}</span>
                      <span className="text-gray-300">{name}</span>
                    </span>
                    <span className={color}>
                      {data.value.toFixed(2)}ms
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User Interactions */}
        {summary && summary.interactions.total > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-sm text-gray-300">User Interactions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total:</span>
                <span className="text-white">{summary.interactions.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Slow (&gt;100ms):</span>
                <span className={summary.interactions.slow > 0 ? 'text-yellow-400' : 'text-green-400'}>
                  {summary.interactions.slow}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Average:</span>
                <span className="text-white">{summary.interactions.average.toFixed(2)}ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Component Render Counts */}
        {renderCountEntries.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 text-sm text-gray-300">Component Renders</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {renderCountEntries.map(([name, count]) => {
                const emoji = count > 20 ? '🔴' : count > 10 ? '🟡' : '🟢';
                const color = count > 20 ? 'text-red-400' : count > 10 ? 'text-yellow-400' : 'text-green-400';
                
                return (
                  <div key={name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 truncate flex-1">
                      <span>{emoji}</span>
                      <span className="text-gray-300 truncate">{name}</span>
                    </span>
                    <span className={`${color} ml-2 flex-shrink-0`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 border-t border-gray-700 space-y-2">
          <button
            onClick={() => {
              logPerformanceSummary();
              logRenderCounts();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            Log to Console
          </button>
          <button
            onClick={() => {
              setSummary(getPerformanceSummary());
              setRenderCounts(getRenderCounts());
            }}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 px-4 py-2 text-xs text-gray-400 border-t border-gray-700">
        Press <kbd className="bg-gray-700 px-1 rounded">Ctrl+Shift+P</kbd> to toggle
      </div>
    </div>
  );
}
