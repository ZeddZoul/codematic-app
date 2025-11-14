'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { RepositoryCard } from '@/components/dashboard/RepositoryCard';
import { Pagination } from '@/components/ui/pagination';
import { SkeletonLoader } from '@/components/ui/loading-spinner';
import { colors } from '@/lib/design-system';
import { useToast } from '@/lib/hooks/useToast';
import { useRepositories, Repository } from '@/lib/hooks/useRepositories';
import { DynamicIcon } from '@/lib/icons';
import { FaCodeBranch } from 'react-icons/fa';

// Dynamically import SearchBar component with loading state
const SearchBar = dynamic(
  () => import('@/components/dashboard/SearchBar').then((mod) => ({ default: mod.SearchBar })),
  {
    loading: () => (
      <div 
        className="w-full px-4 py-3 border rounded-lg"
        style={{ borderColor: colors.text.secondary + '40' }}
        role="status"
        aria-label="Loading search"
      >
        <SkeletonLoader variant="text" lines={1} />
      </div>
    ),
    ssr: false,
  }
);

export default function RepositoriesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Build filters for TanStack Query
  const filters = useMemo(() => ({
    page: currentPage,
    pageSize: 10,
    search: searchQuery || undefined,
  }), [currentPage, searchQuery]);

  // Use TanStack Query hook for data fetching with caching
  const { data, isLoading, error, isFetching } = useRepositories(filters);

  /**
   * Effect: Display error toast when repository loading fails
   * Purpose: Provide user feedback for data fetching errors
   * Dependencies: error, isLoading, showToast
   * Note: Only runs when loading completes and an error exists
   */
  useEffect(() => {
    if (error && !isLoading) {
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to load repositories',
      });
    }
  }, [error, isLoading, showToast]);

  const repositories = data?.repositories || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  };

  // Handle search changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to page 1 on search
  }, []);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handle repository click
  const handleRepositoryClick = useCallback((repo: Repository) => {
    router.push(`/check/${repo.id}`);
  }, [router]);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 
            className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2"
            style={{ color: colors.text.primary }}
          >
            Repositories
          </h1>
          <p 
            className="text-sm sm:text-base lg:text-lg"
            style={{ color: colors.text.secondary }}
          >
            Manage and monitor your repositories for compliance issues
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search repositories by name..."
          />
        </div>

        {/* Background revalidation indicator */}
        {isFetching && !isLoading && (
          <div 
            className="mb-4 p-2 rounded text-center text-sm"
            style={{ 
              backgroundColor: colors.primary.accent + '10',
              color: colors.primary.accent,
            }}
            role="status"
            aria-live="polite"
          >
            Updating repositories...
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading repositories">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg" style={{ borderColor: colors.text.secondary + '40' }}>
                <SkeletonLoader variant="card" />
              </div>
            ))}
            <span className="sr-only">Loading repositories...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div 
            className="p-6 rounded-lg border text-center"
            style={{ 
              borderColor: colors.status.error,
              backgroundColor: colors.status.error + '10',
            }}
          >
            <p style={{ color: colors.status.error }} className="font-medium">
              {error instanceof Error ? error.message : 'Failed to load repositories'}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && repositories.length === 0 && (
          <div 
            className="p-12 rounded-lg border text-center"
            style={{ 
              borderColor: colors.text.secondary + '40',
              backgroundColor: colors.background.subtle,
            }}
          >
            <div className="flex justify-center mb-4">
              <DynamicIcon
                icon={FaCodeBranch}
                state="inactive"
                size={64}
                ariaLabel="No repositories"
                decorative
              />
            </div>
            <h3 
              className="text-xl font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              {searchQuery ? 'No repositories found' : 'No repositories available'}
            </h3>
            <p style={{ color: colors.text.secondary }}>
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Install the GitHub App on your repositories to get started'
              }
            </p>
          </div>
        )}

        {/* Repository List */}
        {!isLoading && !error && repositories.length > 0 && (
          <>
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {repositories.map((repo) => (
                <RepositoryCard
                  key={repo.id}
                  id={repo.id}
                  name={repo.name}
                  fullName={repo.full_name}
                  description={repo.description}
                  status={repo.lastCheckStatus}
                  lastCheckDate={repo.lastCheckDate}
                  issueCount={repo.issueCount}
                  onClick={() => handleRepositoryClick(repo)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}

            {/* Results Summary */}
            <div className="mt-3 sm:mt-4 text-center">
              <p 
                className="text-xs sm:text-sm"
                style={{ color: colors.text.secondary }}
              >
                Showing {repositories.length} of {pagination.total} repositories
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
