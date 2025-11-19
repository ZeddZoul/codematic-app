import React from 'react';
import { colors } from '@/lib/design-system';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onPageChange(currentPage + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void, disabled: boolean) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      action();
    }
  };

  const buttonBaseStyles = 'px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 text-sm sm:text-base';
  const disabledStyles = 'opacity-50 cursor-not-allowed';

  return (
    <nav
      className={`flex items-center justify-center gap-2 sm:gap-4 ${className}`}
      role="navigation"
      aria-label="Pagination"
    >
      <button
        onClick={handlePrevious}
        onKeyDown={(e) => handleKeyDown(e, handlePrevious, !canGoPrevious)}
        disabled={!canGoPrevious}
        className={`${buttonBaseStyles} ${!canGoPrevious ? disabledStyles : ''}`}
        style={{
          backgroundColor: canGoPrevious ? colors.background.subtle : colors.background.subtle,
          color: colors.text.primary,
          '--tw-ring-color': colors.primary.accent,
        } as React.CSSProperties}
        aria-label="Go to previous page"
        tabIndex={0}
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 inline-block sm:mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Previous</span>
      </button>

      <span
        className="text-xs sm:text-sm font-medium px-2"
        style={{ color: colors.text.primary }}
        aria-current="page"
      >
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={handleNext}
        onKeyDown={(e) => handleKeyDown(e, handleNext, !canGoNext)}
        disabled={!canGoNext}
        className={`${buttonBaseStyles} ${!canGoNext ? disabledStyles : ''}`}
        style={{
          backgroundColor: canGoNext ? colors.background.subtle : colors.background.subtle,
          color: colors.text.primary,
          '--tw-ring-color': colors.primary.accent,
        } as React.CSSProperties}
        aria-label="Go to next page"
        tabIndex={0}
      >
        <span className="hidden sm:inline">Next</span>
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 inline-block sm:ml-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
