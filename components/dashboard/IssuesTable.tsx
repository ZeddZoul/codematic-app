'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { colors } from '@/lib/design-system';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/lib/icons';
import { MdDescription } from 'react-icons/md';
import { FaTrash } from 'react-icons/fa';
import { getCheckRunErrorMessage } from '@/lib/error-messages';
import { InlineError } from '@/components/ui/error-display';
import { Pagination } from '@/components/ui/pagination';

type Platform = 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE' | 'CHROME_WEB_STORE' | 'MOBILE_PLATFORMS';
type Severity = 'high' | 'medium' | 'low' | 'none';

export interface CheckRun {
  id: string;
  repositoryName: string;
  platforms: Platform[];
  branchName?: string;
  checkDate: Date;
  highestSeverity: Severity;
  totalIssues: number;
  status?: string;
  errorType?: string | null;
  errorMessage?: string | null;
  errorDetails?: string | null;
}

interface IssuesTableProps {
  checkRuns: CheckRun[];
  onRowClick: (checkRun: CheckRun) => void;
  onDelete?: (checkRunIds: string[]) => Promise<void>;
}

const severityConfig = {
  high: {
    label: 'High',
    variant: 'error' as const,
  },
  medium: {
    label: 'Medium',
    variant: 'warning' as const,
  },
  low: {
    label: 'Low',
    variant: 'info' as const,
  },
  none: {
    label: 'None',
    variant: 'success' as const,
  },
};

const platformLabels: Record<Platform, string> = {
  APPLE_APP_STORE: 'Apple App Store',
  GOOGLE_PLAY_STORE: 'Google Play Store',
  CHROME_WEB_STORE: 'Chrome Web Store',
  MOBILE_PLATFORMS: 'Mobile Platforms',
};

export function IssuesTable({ checkRuns, onRowClick, onDelete }: IssuesTableProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Calculate pagination
  const totalPages = Math.ceil(checkRuns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCheckRuns = checkRuns.slice(startIndex, endIndex);
  
  // Reset selection when checkRuns change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [checkRuns]);
  
  // Reset to page 1 when checkRuns change
  useEffect(() => {
    setCurrentPage(1);
  }, [checkRuns]);

  const formatDate = useCallback((date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatPlatforms = useCallback((platforms: Platform[]) => {
    if (platforms.length === 0) return 'N/A';
    if (platforms.length === 1) return platformLabels[platforms[0]];
    if (platforms.length === 2 && platforms.includes('APPLE_APP_STORE') && platforms.includes('GOOGLE_PLAY_STORE')) {
      return 'Mobile Platforms';
    }
    // For multiple platforms, show them separated by commas
    return platforms.map(p => platformLabels[p]).join(', ');
  }, []);

  // Selection handlers
  const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (selectedIds.size === paginatedCheckRuns.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedCheckRuns.map(run => run.id)));
    }
  }, [selectedIds.size, paginatedCheckRuns]);

  const handleSelectItem = useCallback((e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }, [selectedIds]);

  // Action handlers
  const handleDelete = useCallback(async () => {
    if (!onDelete || selectedIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      await onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to delete check runs:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, selectedIds]);



  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedIds(new Set()); // Clear selection when changing pages
  }, []);

  /**
   * Effect: Handle arrow key navigation in table
   * Purpose: Enable keyboard navigation between table rows for accessibility
   * Dependencies: [checkRuns] - Re-attach listener when rows change
   * Note: Cleanup function removes event listener to prevent memory leaks
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tableRef.current) return;
      
      const activeElement = document.activeElement as HTMLElement;
      const rows = Array.from(tableRef.current.querySelectorAll('tbody tr[role="button"]'));
      const currentIndex = rows.indexOf(activeElement);

      if (currentIndex === -1) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextRow = rows[currentIndex + 1] as HTMLElement;
        if (nextRow) nextRow.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevRow = rows[currentIndex - 1] as HTMLElement;
        if (prevRow) prevRow.focus();
      }
    };

    const table = tableRef.current;
    if (table) {
      table.addEventListener('keydown', handleKeyDown);
      return () => table.removeEventListener('keydown', handleKeyDown);
    }
  }, [checkRuns]);

  if (checkRuns.length === 0) {
    return (
      <div 
        className="p-12 rounded-lg border text-center"
        style={{ 
          borderColor: colors.text.secondary + '40',
          backgroundColor: colors.background.subtle,
        }}
      >
        <div className="flex justify-center mb-4">
          <DynamicIcon
            icon={MdDescription}
            state="inactive"
            size={64}
            ariaLabel="No check runs"
            decorative
          />
        </div>
        <h3 
          className="text-xl font-semibold mb-2"
          style={{ color: colors.text.primary }}
        >
          No check runs found
        </h3>
        <p style={{ color: colors.text.secondary }}>
          Try adjusting your filters or run a compliance check on your repositories
        </p>
      </div>
    );
  }

  const hasActions = onDelete;
  const allSelected = selectedIds.size === paginatedCheckRuns.length && paginatedCheckRuns.length > 0;
  const someSelected = selectedIds.size > 0;

  return (
    <>
      {/* Action Bar - Only show delete functionality */}
      {onDelete && (
        <div className="flex items-center justify-between gap-4 p-4 border-b" style={{ borderColor: colors.text.secondary + '20' }}>
          <div className="flex items-center gap-3">
            {paginatedCheckRuns.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-2 focus:ring-2 focus:ring-offset-2 appearance-none cursor-pointer transition-all duration-200 hover:border-opacity-80"
                    style={{
                      borderColor: allSelected ? colors.primary.accent : colors.text.secondary + '60',
                      backgroundColor: allSelected ? colors.primary.accent : 'transparent',
                      '--tw-ring-color': colors.primary.accent,
                    } as React.CSSProperties}
                    onMouseEnter={(e) => {
                      if (!allSelected) {
                        e.currentTarget.style.borderColor = colors.primary.accent + '80';
                        e.currentTarget.style.backgroundColor = colors.primary.accent + '10';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!allSelected) {
                        e.currentTarget.style.borderColor = colors.text.secondary + '60';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  />
                  {allSelected && (
                    <svg
                      className="absolute w-3 h-3 text-white pointer-events-none"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  {allSelected ? 'Deselect All' : 'Select All'}
                </span>
              </label>
            )}
            {someSelected && (
              <span className="text-sm" style={{ color: colors.text.secondary }}>
                {selectedIds.size} selected
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {someSelected && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                style={{
                  backgroundColor: colors.status.error,
                  color: 'white',
                  opacity: isDeleting ? 0.6 : 1,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                <FaTrash size={14} />
                {isDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table ref={tableRef} className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: colors.background.subtle }}>
              {onDelete && (
                <th 
                  scope="col"
                  className="text-left px-4 py-3 font-semibold text-sm border-b w-12"
                  style={{ 
                    color: colors.text.primary,
                    borderColor: colors.text.secondary + '20',
                  }}
                >
                  <span className="sr-only">Select</span>
                </th>
              )}

              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Repository
              </th>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Platforms
              </th>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Branch
              </th>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Date
              </th>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Severity
              </th>
              <th 
                scope="col"
                className="text-left px-4 py-3 font-semibold text-sm border-b"
                style={{ 
                  color: colors.text.primary,
                  borderColor: colors.text.secondary + '20',
                }}
              >
                Issues
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedCheckRuns.map((checkRun) => {
              const severityInfo = severityConfig[checkRun.highestSeverity];
              const isFailed = checkRun.status === 'FAILED';
              const errorMessage = isFailed 
                ? getCheckRunErrorMessage(checkRun.errorType || null, checkRun.errorMessage || null, checkRun.errorDetails || null)
                : null;
              
              return (
                <tr
                  key={checkRun.id}
                  className="transition-colors border-b hover:bg-opacity-50"
                  style={{ 
                    borderColor: colors.text.secondary + '20',
                    backgroundColor: colors.background.main,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background.subtle;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.background.main;
                  }}
                >
                  {onDelete && (
                    <td className="px-4 py-3">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(checkRun.id)}
                          onChange={(e) => handleSelectItem(e, checkRun.id)}
                          className="w-4 h-4 rounded border-2 focus:ring-2 focus:ring-offset-2 appearance-none cursor-pointer transition-all duration-200"
                          style={{
                            borderColor: selectedIds.has(checkRun.id) ? colors.primary.accent : colors.text.secondary + '60',
                            backgroundColor: selectedIds.has(checkRun.id) ? colors.primary.accent : 'transparent',
                            '--tw-ring-color': colors.primary.accent,
                          } as React.CSSProperties}
                          onMouseEnter={(e) => {
                            if (!selectedIds.has(checkRun.id)) {
                              e.currentTarget.style.borderColor = colors.primary.accent + '80';
                              e.currentTarget.style.backgroundColor = colors.primary.accent + '10';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedIds.has(checkRun.id)) {
                              e.currentTarget.style.borderColor = colors.text.secondary + '60';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                          aria-label={`Select issue for ${checkRun.repositoryName}`}
                        />
                        {selectedIds.has(checkRun.id) && (
                          <svg
                            className="absolute w-3 h-3 text-white pointer-events-none"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </td>
                  )}

                  <td 
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => onRowClick(checkRun)}
                  >
                    <span 
                      className="font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {checkRun.repositoryName}
                    </span>
                  </td>
                  <td 
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => onRowClick(checkRun)}
                  >
                    <span style={{ color: colors.text.secondary }}>
                      {formatPlatforms(checkRun.platforms)}
                    </span>
                  </td>
                  <td 
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => onRowClick(checkRun)}
                  >
                    <span style={{ color: colors.text.secondary }}>
                      {checkRun.branchName || 'main'}
                    </span>
                  </td>
                  <td 
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => onRowClick(checkRun)}
                  >
                    <span style={{ color: colors.text.secondary }}>
                      {formatDate(checkRun.checkDate)}
                    </span>
                  </td>
                  <td 
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => onRowClick(checkRun)}
                  >
                    {isFailed && errorMessage ? (
                      <InlineError error={errorMessage} compact />
                    ) : (
                      <Badge variant={severityInfo.variant} size="sm" showIcon>
                        {severityInfo.label}
                      </Badge>
                    )}
                  </td>
                  <td 
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => onRowClick(checkRun)}
                  >
                    {isFailed ? (
                      <span 
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        N/A
                      </span>
                    ) : (
                      <span 
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {checkRun.totalIssues}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-3">
        {paginatedCheckRuns.map((checkRun) => {
          const severityInfo = severityConfig[checkRun.highestSeverity];
          const isFailed = checkRun.status === 'FAILED';
          const errorMessage = isFailed 
            ? getCheckRunErrorMessage(checkRun.errorType || null, checkRun.errorMessage || null, checkRun.errorDetails || null)
            : null;
          
          return (
            <div
              key={checkRun.id}
              className="p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{
                borderColor: colors.text.secondary + '40',
                backgroundColor: colors.background.main,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.subtle;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.background.main;
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {onDelete && (
                    <div className="relative flex items-center justify-center mt-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(checkRun.id)}
                        onChange={(e) => handleSelectItem(e, checkRun.id)}
                        className="w-4 h-4 rounded border-2 focus:ring-2 focus:ring-offset-2 appearance-none cursor-pointer transition-all duration-200"
                        style={{
                          borderColor: selectedIds.has(checkRun.id) ? colors.primary.accent : colors.text.secondary + '60',
                          backgroundColor: selectedIds.has(checkRun.id) ? colors.primary.accent : 'transparent',
                          '--tw-ring-color': colors.primary.accent,
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                          if (!selectedIds.has(checkRun.id)) {
                            e.currentTarget.style.borderColor = colors.primary.accent + '80';
                            e.currentTarget.style.backgroundColor = colors.primary.accent + '10';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedIds.has(checkRun.id)) {
                            e.currentTarget.style.borderColor = colors.text.secondary + '60';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                        aria-label={`Select issue for ${checkRun.repositoryName}`}
                      />
                      {selectedIds.has(checkRun.id) && (
                        <svg
                          className="absolute w-3 h-3 text-white pointer-events-none"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => onRowClick(checkRun)}
                    className="flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded"
                    style={{
                      '--tw-ring-color': colors.primary.accent,
                    } as React.CSSProperties}
                    aria-label={`View details for ${checkRun.repositoryName} issues`}
                  >
                    <h3 
                      className="font-semibold text-base mb-1 truncate"
                      style={{ color: colors.text.primary }}
                    >
                      {checkRun.repositoryName}
                    </h3>
                  </button>
                </div>
                {isFailed && errorMessage ? (
                  <InlineError error={errorMessage} compact />
                ) : (
                  <Badge variant={severityInfo.variant} size="sm" showIcon>
                    {severityInfo.label}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>Platform:</span>
                  <span style={{ color: colors.text.primary }}>
                    {formatPlatforms(checkRun.platforms)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>Branch:</span>
                  <span style={{ color: colors.text.primary }}>
                    {checkRun.branchName || 'main'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>Issues:</span>
                  {isFailed ? (
                    <span style={{ color: colors.text.secondary }}>N/A</span>
                  ) : (
                    <span 
                      className="font-medium"
                      style={{ color: colors.text.primary }}
                    >
                      {checkRun.totalIssues}
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span style={{ color: colors.text.secondary }}>Date:</span>
                  <span style={{ color: colors.text.primary }}>
                    {formatDate(checkRun.checkDate)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-6 border-t" style={{ borderColor: colors.text.secondary + '20' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}


    </>
  );
}
