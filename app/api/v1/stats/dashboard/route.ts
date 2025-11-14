import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { getGithubClient } from '@/lib/github';

interface DashboardStats {
  totalRepositories: number;
  pendingIssues: number;
  recentChecks: number;
  complianceRate: number;
  trends: {
    repositories: { value: number; direction: 'up' | 'down' };
    issues: { value: number; direction: 'up' | 'down' };
  };
}

export async function GET() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Fetch total repositories from GitHub
    let totalRepositories = 0;
    try {
      const octokit = getGithubClient();
      const { data } = await octokit.request('GET /installation/repositories');
      totalRepositories = data.total_count || data.repositories?.length || 0;
    } catch (error) {
      console.error('Error fetching repositories count:', error);
      // Continue with 0 if GitHub API fails
    }

    // Get current date ranges for trend calculation
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch all recent reports (last 30 days)
    const recentReports = await prisma.complianceReport.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch reports from 30-60 days ago for trend comparison
    const previousReports = await prisma.complianceReport.findMany({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    // Calculate pending issues from recent reports
    let pendingIssues = 0;
    const repositoryIssues = new Map<string, number>();

    recentReports.forEach((report: any) => {
      const issues = report.issues as any;
      if (Array.isArray(issues)) {
        // Get the latest report per repository
        const repoKey = report.installationId;
        if (!repositoryIssues.has(repoKey)) {
          repositoryIssues.set(repoKey, issues.length);
        }
      }
    });

    // Sum up issues from latest reports per repository
    repositoryIssues.forEach((count) => {
      pendingIssues += count;
    });

    // Calculate recent checks (last 30 days)
    const recentChecks = recentReports.length;

    // Calculate compliance rate
    // Compliance = repositories with 0 issues / total repositories with checks
    const repositoriesWithChecks = repositoryIssues.size;
    const compliantRepositories = Array.from(repositoryIssues.values()).filter(
      (count) => count === 0
    ).length;
    const complianceRate =
      repositoriesWithChecks > 0
        ? Math.round((compliantRepositories / repositoriesWithChecks) * 100)
        : 100;

    // Calculate trends
    // Repository trend: compare installations count
    const currentInstallations = await prisma.installation.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const previousInstallations = await prisma.installation.count({
      where: {
        createdAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
    });

    const repositoryTrendValue =
      previousInstallations > 0
        ? Math.round(
            ((currentInstallations - previousInstallations) / previousInstallations) * 100
          )
        : 0;

    // Issue trend: compare total issues
    let previousPendingIssues = 0;
    const previousRepositoryIssues = new Map<string, number>();

    previousReports.forEach((report: any) => {
      const issues = report.issues as any;
      if (Array.isArray(issues)) {
        const repoKey = report.installationId;
        if (!previousRepositoryIssues.has(repoKey)) {
          previousRepositoryIssues.set(repoKey, issues.length);
        }
      }
    });

    previousRepositoryIssues.forEach((count) => {
      previousPendingIssues += count;
    });

    const issueTrendValue =
      previousPendingIssues > 0
        ? Math.round(((pendingIssues - previousPendingIssues) / previousPendingIssues) * 100)
        : 0;

    const stats: DashboardStats = {
      totalRepositories,
      pendingIssues,
      recentChecks,
      complianceRate,
      trends: {
        repositories: {
          value: Math.abs(repositoryTrendValue),
          direction: repositoryTrendValue >= 0 ? 'up' : 'down',
        },
        issues: {
          value: Math.abs(issueTrendValue),
          direction: issueTrendValue >= 0 ? 'up' : 'down',
        },
      },
    };

    // Cache the response for 2 minutes with stale-while-revalidate
    // s-maxage: cache for 2 minutes on CDN/edge
    // stale-while-revalidate: serve stale content for 4 minutes while revalidating
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240, max-age=60',
      },
    });
  } catch (error: any) {
    console.error('Error calculating dashboard stats:', error);

    return NextResponse.json(
      {
        error: 'Failed to calculate dashboard statistics',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
