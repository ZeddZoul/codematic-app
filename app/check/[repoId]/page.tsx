'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { IssueSummary } from '@/components/results/IssueSummary';
import { IssueGroup } from '@/components/results/IssueGroup';
import { IssueCard } from '@/components/results/IssueCard';
import { colors } from '@/lib/design-system';

interface Issue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  solution: string;
  file?: string;
}

interface CheckResults {
  status: string;
  summary: {
    totalIssues: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
  };
  issues: Issue[];
}

export default function CheckResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState<CheckResults | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Effect: Load check results from sessionStorage on mount
   * Purpose: Retrieve stored check results from previous navigation
   * Dependencies: [] (empty - only runs once on mount)
   * Note: Sets loading to false regardless of whether results are found
   */
  useEffect(() => {
    const storedResults = sessionStorage.getItem('check_results');
    if (storedResults) {
      setResults(JSON.parse(storedResults));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  // Group issues by severity - memoized to avoid re-filtering on every render
  const groupedIssues = useMemo(() => ({
    high: results?.issues.filter(issue => issue.severity === 'high') || [],
    medium: results?.issues.filter(issue => issue.severity === 'medium') || [],
    low: results?.issues.filter(issue => issue.severity === 'low') || [],
  }), [results?.issues]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div 
          className="max-w-md w-full p-8 rounded-lg border text-center"
          style={{ 
            borderColor: colors.text.secondary + '40',
            backgroundColor: colors.background.subtle,
          }}
        >
          <svg
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: colors.text.secondary }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: colors.text.primary }}
          >
            No Results Found
          </h3>
          <p className="mb-6" style={{ color: colors.text.secondary }}>
            The check results could not be loaded. Please run a new compliance check.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background.subtle }}>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center gap-2">
          <h1 
            className="text-base sm:text-xl lg:text-2xl font-bold truncate"
            style={{ color: colors.text.primary }}
          >
            <span className="hidden sm:inline">Compliance Check Results</span>
            <span className="sm:hidden">Check Results</span>
          </h1>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Issue Summary Cards */}
        <IssueSummary
          totalIssues={results.summary.totalIssues}
          highSeverity={results.summary.highSeverity}
          mediumSeverity={results.summary.mediumSeverity}
          lowSeverity={results.summary.lowSeverity}
        />

        {/* Issues Grouped by Severity */}
        {results.issues.length === 0 ? (
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm text-center">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">✅</div>
            <h3 
              className="text-xl sm:text-2xl font-bold mb-2"
              style={{ color: colors.status.success }}
            >
              All Clear!
            </h3>
            <p className="text-sm sm:text-base" style={{ color: colors.text.secondary }}>
              No compliance issues found in this repository.
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <h2 
              className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4"
              style={{ color: colors.text.primary }}
            >
              Issues Found
            </h2>

            {/* High Severity Issues */}
            <IssueGroup severity="high" issues={groupedIssues.high}>
              {groupedIssues.high.map((issue, index) => (
                <IssueCard key={`high-${index}`} issue={issue} />
              ))}
            </IssueGroup>

            {/* Medium Severity Issues */}
            <IssueGroup severity="medium" issues={groupedIssues.medium}>
              {groupedIssues.medium.map((issue, index) => (
                <IssueCard key={`medium-${index}`} issue={issue} />
              ))}
            </IssueGroup>

            {/* Low Severity Issues */}
            <IssueGroup severity="low" issues={groupedIssues.low}>
              {groupedIssues.low.map((issue, index) => (
                <IssueCard key={`low-${index}`} issue={issue} />
              ))}
            </IssueGroup>
          </div>
        )}
      </main>
    </div>
  );
}
