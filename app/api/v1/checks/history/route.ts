import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

type Platform = 'APPLE_APP_STORE' | 'GOOGLE_PLAY_STORE';
type Severity = 'high' | 'medium' | 'low' | 'none';

interface CheckRun {
  id: string;
  repositoryName: string;
  platforms: Platform[];
  checkDate: Date;
  highestSeverity: Severity;
  totalIssues: number;
}

export async function GET(request: Request) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const platformFilter = searchParams.get('platform') || 'all';
    const repositoryFilter = searchParams.get('repository') || 'all';
    const severityFilter = searchParams.get('severity') || 'all';

    console.log('Fetching check history with filters:', {
      page,
      pageSize,
      platform: platformFilter,
      repository: repositoryFilter,
      severity: severityFilter,
    });

    // Build where clause for filtering
    const whereClause: any = {};

    // Repository filter
    if (repositoryFilter !== 'all') {
      whereClause.installation = {
        OR: [
          { repo: { contains: repositoryFilter, mode: 'insensitive' } },
          { owner: { contains: repositoryFilter, mode: 'insensitive' } },
        ],
      };
    }

    // Fetch all reports with filters
    const reports = await prisma.complianceReport.findMany({
      where: whereClause,
      include: {
        installation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${reports.length} total reports`);

    // Process and filter reports
    const checkRuns: CheckRun[] = reports
      .map((report: any) => {
        const issues = report.issues as any;
        const summary = report.summary as any;
        
        // Extract platforms from summary or issues
        let platforms: Platform[] = [];
        if (summary && summary.checkType) {
          if (summary.checkType === 'BOTH') {
            platforms = ['APPLE_APP_STORE', 'GOOGLE_PLAY_STORE'];
          } else {
            platforms = [summary.checkType as Platform];
          }
        } else if (Array.isArray(issues) && issues.length > 0) {
          // Try to infer from issues
          const hasApple = issues.some((i: any) => 
            i.platform === 'APPLE_APP_STORE' || 
            i.category?.toLowerCase().includes('apple') ||
            i.category?.toLowerCase().includes('ios')
          );
          const hasGoogle = issues.some((i: any) => 
            i.platform === 'GOOGLE_PLAY_STORE' || 
            i.category?.toLowerCase().includes('google') ||
            i.category?.toLowerCase().includes('android')
          );
          
          if (hasApple) platforms.push('APPLE_APP_STORE');
          if (hasGoogle) platforms.push('GOOGLE_PLAY_STORE');
        }

        // If no platforms detected, default to both
        if (platforms.length === 0) {
          platforms = ['APPLE_APP_STORE', 'GOOGLE_PLAY_STORE'];
        }

        // Calculate severity and issue count
        let totalIssues = 0;
        let highestSeverity: Severity = 'none';

        if (Array.isArray(issues)) {
          totalIssues = issues.length;

          const hasCritical = issues.some((issue: any) => 
            issue.severity === 'high' || issue.severity === 'critical'
          );
          const hasMedium = issues.some((issue: any) => 
            issue.severity === 'medium' || issue.severity === 'warning'
          );
          const hasLow = issues.some((issue: any) => 
            issue.severity === 'low' || issue.severity === 'info'
          );

          if (hasCritical) {
            highestSeverity = 'high';
          } else if (hasMedium) {
            highestSeverity = 'medium';
          } else if (hasLow) {
            highestSeverity = 'low';
          }
        } else if (summary && typeof summary.totalIssues === 'number') {
          totalIssues = summary.totalIssues;
          
          if (summary.highSeverity > 0) {
            highestSeverity = 'high';
          } else if (summary.mediumSeverity > 0) {
            highestSeverity = 'medium';
          } else if (summary.lowSeverity > 0) {
            highestSeverity = 'low';
          }
        }

        return {
          id: report.id,
          repositoryName: `${report.installation.owner}/${report.installation.repo}`,
          platforms,
          checkDate: report.createdAt,
          highestSeverity,
          totalIssues,
        };
      })
      .filter((checkRun: CheckRun) => {
        // Apply platform filter
        if (platformFilter !== 'all') {
          if (!checkRun.platforms.includes(platformFilter as Platform)) {
            return false;
          }
        }

        // Apply severity filter
        if (severityFilter !== 'all') {
          if (checkRun.highestSeverity !== severityFilter) {
            return false;
          }
        }

        return true;
      });

    console.log(`After filtering: ${checkRuns.length} check runs`);

    // Get total count before pagination
    const total = checkRuns.length;
    const totalPages = Math.ceil(total / pageSize);

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCheckRuns = checkRuns.slice(startIndex, endIndex);

    // Cache check history for 30 seconds with stale-while-revalidate
    // Check runs update frequently, so shorter cache time is appropriate
    return NextResponse.json({
      checkRuns: paginatedCheckRuns,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60, max-age=15',
      },
    });
  } catch (error: any) {
    console.error('Error fetching check history:', error.message);
    console.error('Error details:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch check history',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
