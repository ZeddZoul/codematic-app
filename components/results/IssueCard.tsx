'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { colors } from '@/lib/design-system';

interface Issue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string;
  file?: string;
}

interface IssueCardProps {
  issue: Issue;
}

export const IssueCard = React.memo<IssueCardProps>(function IssueCard({ issue }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const severityVariant = {
    high: 'error' as const,
    medium: 'warning' as const,
    low: 'info' as const,
  };

  const toggleExpanded = React.useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Card Header - Always Visible */}
      <button
        onClick={toggleExpanded}
        className="w-full p-3 sm:p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ '--tw-ring-color': colors.primary.accent } as React.CSSProperties}
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
              <Badge variant={severityVariant[issue.severity]} size="sm" showIcon>
                {issue.severity.toUpperCase()}
              </Badge>
              <span 
                className="text-xs sm:text-sm font-semibold"
                style={{ color: colors.text.secondary }}
              >
                {issue.category}
              </span>
            </div>
            
            {issue.file && (
              <div 
                className="text-xs sm:text-sm mb-2 flex items-center gap-1"
                style={{ color: colors.text.secondary }}
              >
                <svg 
                  className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                  />
                </svg>
                <span className="truncate">{issue.file}</span>
              </div>
            )}

            <p 
              className="text-xs sm:text-sm line-clamp-2"
              style={{ color: colors.text.primary }}
            >
              {issue.description}
            </p>
          </div>

          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform mt-1"
            style={{ 
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              color: colors.text.secondary,
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-3 sm:space-y-4 animate-fadeIn">
          {/* Full Description */}
          <div>
            <h3 
              className="font-semibold mb-2 text-xs sm:text-sm"
              style={{ color: colors.text.primary }}
            >
              Issue Details:
            </h3>
            <p 
              className="text-xs sm:text-sm"
              style={{ color: colors.text.primary }}
            >
              {issue.description}
            </p>
          </div>

          {/* Solution Section - Visually Distinct */}
          <div 
            className="p-3 sm:p-4 rounded-lg border-l-4"
            style={{ 
              backgroundColor: '#EFF6FF',
              borderLeftColor: colors.primary.accent,
            }}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              {/* Lightbulb Icon */}
              <svg 
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" 
                style={{ color: colors.primary.accent }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
              
              <div className="flex-1 min-w-0">
                <h3 
                  className="font-semibold mb-2 text-xs sm:text-sm"
                  style={{ color: colors.primary.accent }}
                >
                  Recommended Solution
                </h3>
                <p 
                  className="text-xs sm:text-sm"
                  style={{ color: colors.text.primary }}
                >
                  {issue.solution}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
