'use client';

import { useState } from 'react';
import { colors } from '@/lib/design-system';

interface Issue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string;
  file?: string;
}

interface IssueGroupProps {
  severity: 'high' | 'medium' | 'low';
  issues: Issue[];
  children: React.ReactNode;
}

const severityConfig = {
  high: {
    label: 'High Severity',
    color: colors.status.error,
    bgColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  medium: {
    label: 'Medium Severity',
    color: colors.status.warning,
    bgColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  low: {
    label: 'Low Severity',
    color: colors.status.info,
    bgColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
};

export function IssueGroup({ severity, issues, children }: IssueGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = severityConfig[severity];

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-6">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 sm:p-4 min-h-[44px] rounded-lg border-2 transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ 
          borderColor: config.borderColor,
          backgroundColor: isExpanded ? config.bgColor : 'white',
          '--tw-ring-color': colors.primary.accent,
        } as React.CSSProperties}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span 
            className="text-base sm:text-lg font-bold"
            style={{ color: config.color }}
          >
            <span className="hidden sm:inline">{config.label}</span>
            <span className="sm:hidden">{severity.charAt(0).toUpperCase() + severity.slice(1)}</span>
          </span>
          <span 
            className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold"
            style={{ 
              backgroundColor: 'white',
              color: config.color,
              border: `2px solid ${config.borderColor}`,
            }}
          >
            {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
          </span>
        </div>
        
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 transition-transform flex-shrink-0"
          style={{ 
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            color: config.color,
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Group Content */}
      {isExpanded && (
        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
