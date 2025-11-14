'use client';

import { useCallback } from 'react';
import { colors } from '@/lib/design-system';
import { PlatformSelector, Platform } from '@/components/ui/platform-selector';

export interface IssueFiltersState {
  platform: 'all' | Platform;
  repository: string;
  severity: 'all' | 'high' | 'medium' | 'low';
}

interface IssueFiltersProps {
  filters: IssueFiltersState;
  onFilterChange: (filters: IssueFiltersState) => void;
  repositories?: string[];
}

export function IssueFilters({ filters, onFilterChange, repositories = [] }: IssueFiltersProps) {
  const handlePlatformChange = useCallback((value: Platform | 'all') => {
    onFilterChange({
      ...filters,
      platform: value,
    });
  }, [filters, onFilterChange]);

  const handleRepositoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      repository: e.target.value,
    });
  }, [filters, onFilterChange]);

  const handleSeverityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      severity: e.target.value as IssueFiltersState['severity'],
    });
  }, [filters, onFilterChange]);

  const selectStyles = {
    backgroundColor: colors.background.main,
    color: colors.text.primary,
    borderColor: colors.text.secondary + '40',
  };

  return (
    <div 
      className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border" 
      style={{ borderColor: colors.text.secondary + '20', backgroundColor: colors.background.subtle }}
      role="search"
      aria-label="Filter check runs"
    >
      {/* Platform Filter */}
      <div className="flex-1">
        <label 
          htmlFor="platform-filter" 
          className="block text-sm font-medium mb-2"
          style={{ color: colors.text.primary }}
        >
          Platform
        </label>
        <select
          id="platform-filter"
          value={filters.platform}
          onChange={(e) => handlePlatformChange(e.target.value as Platform | 'all')}
          className="w-full px-3 py-3 min-h-[44px] rounded-lg border focus-visible:outline-none focus-visible:ring-2 transition-all"
          style={{
            ...selectStyles,
            '--tw-ring-color': colors.primary.accent,
          } as React.CSSProperties}
        >
          <option value="all">All Platforms</option>
          <option value="APPLE_APP_STORE">Apple App Store</option>
          <option value="GOOGLE_PLAY_STORE">Google Play Store</option>
          <option value="BOTH">Both Stores</option>
        </select>
      </div>

      {/* Repository Filter */}
      <div className="flex-1">
        <label 
          htmlFor="repository-filter" 
          className="block text-sm font-medium mb-2"
          style={{ color: colors.text.primary }}
        >
          Repository
        </label>
        <select
          id="repository-filter"
          value={filters.repository}
          onChange={handleRepositoryChange}
          className="w-full px-3 py-3 min-h-[44px] rounded-lg border focus-visible:outline-none focus-visible:ring-2 transition-all"
          style={{
            ...selectStyles,
            '--tw-ring-color': colors.primary.accent,
          } as React.CSSProperties}
        >
          <option value="all">All Repositories</option>
          {repositories.map((repo) => (
            <option key={repo} value={repo}>
              {repo}
            </option>
          ))}
        </select>
      </div>

      {/* Severity Filter */}
      <div className="flex-1">
        <label 
          htmlFor="severity-filter" 
          className="block text-sm font-medium mb-2"
          style={{ color: colors.text.primary }}
        >
          Severity
        </label>
        <select
          id="severity-filter"
          value={filters.severity}
          onChange={handleSeverityChange}
          className="w-full px-3 py-3 min-h-[44px] rounded-lg border focus-visible:outline-none focus-visible:ring-2 transition-all"
          style={{
            ...selectStyles,
            '--tw-ring-color': colors.primary.accent,
          } as React.CSSProperties}
        >
          <option value="all">All Severities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
  );
}
