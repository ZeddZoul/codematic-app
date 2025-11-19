'use client';

import React from 'react';
import { colors } from '@/lib/design-system';

interface RunCheckButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const RunCheckButton = React.memo<RunCheckButtonProps>(function RunCheckButton({
  onClick,
  disabled = false,
  isLoading = false,
  className = '',
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 min-h-[48px] font-medium text-sm relative overflow-hidden group ${className}`}
      style={{
        backgroundColor: isHovered && !isLoading 
          ? colors.primary.accent 
          : colors.primary.accent + '10',
        color: isHovered && !isLoading 
          ? 'white' 
          : colors.primary.accent,
        border: `1px solid ${colors.primary.accent + '30'}`,
        '--tw-ring-color': colors.primary.accent,
        cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
        opacity: (disabled || isLoading) ? 0.6 : 1,
      } as React.CSSProperties}
      aria-label={isLoading ? 'Running compliance check' : 'Run compliance check'}
    >
      {/* Button content */}
      <div className="flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            {/* Simple loading spinner */}
            <div 
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            />
            <span>Running Check...</span>
          </>
        ) : (
          <span>Run Check</span>
        )}
      </div>
    </button>
  );
});