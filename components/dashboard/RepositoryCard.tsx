'use client';

import React from 'react';
import { colors } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';

type RepositoryStatus = 'success' | 'warning' | 'error' | 'none';

interface RepositoryCardProps {
  id: number;
  name: string;
  fullName: string;
  description?: string | null;
  status: RepositoryStatus;
  lastCheckDate?: Date;
  issueCount?: number;
  onClick: () => void;
}

const statusConfig = {
  success: {
    label: 'No Issues',
    variant: 'success' as const,
    dotColor: colors.status.success,
  },
  warning: {
    label: 'Warnings',
    variant: 'warning' as const,
    dotColor: colors.status.warning,
  },
  error: {
    label: 'Critical',
    variant: 'error' as const,
    dotColor: colors.status.error,
  },
  none: {
    label: 'Not Checked',
    variant: 'info' as const,
    dotColor: colors.text.secondary,
  },
};

export const RepositoryCard = React.memo<RepositoryCardProps>(function RepositoryCard({
  name,
  fullName,
  description,
  status,
  lastCheckDate,
  issueCount,
  onClick,
}) {
  const config = statusConfig[status];

  const formatDate = React.useCallback((date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  const handleMouseEnter = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = colors.background.subtle;
  }, []);

  const handleMouseLeave = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = colors.background.main;
  }, []);

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 sm:p-4 rounded-lg border transition-all hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2"
      style={{
        borderColor: colors.text.secondary + '40',
        backgroundColor: colors.background.main,
        '--tw-ring-color': colors.primary.accent,
      } as React.CSSProperties}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`View ${fullName} repository`}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          {/* Repository Name */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 
              className="font-semibold text-base sm:text-lg truncate"
              style={{ color: colors.text.primary }}
            >
              {name}
            </h3>
            <span 
              className="text-xs sm:text-sm flex-shrink-0"
              style={{ color: colors.text.secondary }}
            >
              {fullName.split('/')[0]}/
            </span>
          </div>

          {/* Description - Hidden on very small screens */}
          {description && (
            <p 
              className="hidden sm:block text-sm line-clamp-2 mb-2"
              style={{ color: colors.text.secondary }}
            >
              {description}
            </p>
          )}

          {/* Last Check Info */}
          {lastCheckDate && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <span style={{ color: colors.text.secondary }}>
                Last checked: {formatDate(lastCheckDate)}
              </span>
              {issueCount !== undefined && issueCount > 0 && (
                <>
                  <span className="hidden sm:inline" style={{ color: colors.text.secondary }}>•</span>
                  <span style={{ color: colors.text.secondary }}>
                    {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          <Badge variant={config.variant} size="sm" showIcon>
            <span className="hidden sm:inline">{config.label}</span>
          </Badge>
        </div>
      </div>
    </button>
  );
});
