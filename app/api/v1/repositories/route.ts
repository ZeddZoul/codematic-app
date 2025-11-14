import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getGithubClient } from '@/lib/github';
import { prisma } from '@/lib/prisma';

type RepositoryStatus = 'success' | 'warning' | 'error' | 'none';

interface RepositoryWithStatus {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: any;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  lastCheckStatus: RepositoryStatus;
  lastCheckDate?: Date;
  issueCount?: number;
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
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const search = searchParams.get('search') || '';

    console.log('Fetching repositories...');
    console.log('GitHub App ID:', process.env.GITHUB_APP_ID);
    console.log('Installation ID:', process.env.GITHUB_APP_INSTALLATION_ID);
    console.log('Pagination:', { page, pageSize, search });
    
    const octokit = getGithubClient();
    const { data } = await octokit.request('GET /installation/repositories');
    console.log('Found repositories:', data.repositories?.length || 0);
    
    let repositories = data.repositories || [];
    
    if (repositories.length > 0) {
      console.log('Repository names:', repositories.map((r: any) => r.full_name));
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      repositories = repositories.filter((repo: any) => 
        repo.full_name.toLowerCase().includes(searchLower) ||
        repo.name.toLowerCase().includes(searchLower)
      );
    }

    // Get total count before pagination
    const total = repositories.length;
    const totalPages = Math.ceil(total / pageSize);

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRepos = repositories.slice(startIndex, endIndex);

    // Fetch last check status for each repository
    const repositoriesWithStatus: RepositoryWithStatus[] = await Promise.all(
      paginatedRepos.map(async (repo: any) => {
        // Find the installation for this repository
        const installation = await prisma.installation.findFirst({
          where: {
            owner: repo.owner.login,
            repo: repo.name,
          },
          include: {
            reports: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        });

        let lastCheckStatus: RepositoryStatus = 'none';
        let lastCheckDate: Date | undefined;
        let issueCount: number | undefined;

        if (installation && installation.reports.length > 0) {
          const lastReport = installation.reports[0];
          lastCheckDate = lastReport.createdAt;

          // Calculate status based on issues
          const issues = lastReport.issues as any;
          if (issues && Array.isArray(issues)) {
            issueCount = issues.length;

            // Determine highest severity
            const hasCritical = issues.some((issue: any) => 
              issue.severity === 'high' || issue.severity === 'critical'
            );
            const hasWarning = issues.some((issue: any) => 
              issue.severity === 'medium' || issue.severity === 'warning'
            );

            if (hasCritical) {
              lastCheckStatus = 'error';
            } else if (hasWarning) {
              lastCheckStatus = 'warning';
            } else if (issues.length === 0) {
              lastCheckStatus = 'success';
            } else {
              lastCheckStatus = 'success'; // Low severity issues still count as success
            }
          } else {
            lastCheckStatus = 'success'; // No issues found
          }
        }

        return {
          ...repo,
          lastCheckStatus,
          lastCheckDate,
          issueCount,
        };
      })
    );
    
    // Cache repository list for 5 minutes with stale-while-revalidate
    // Repositories don't change frequently, so longer cache is acceptable
    return NextResponse.json({ 
      repositories: repositoriesWithStatus,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=120',
      },
    });
  } catch (error: any) {
    console.error('Error fetching repositories:', error.message);
    console.error('Error status:', error.status);
    console.error('Error details:', error.response?.data || error);
    
    // Return empty array instead of error so UI doesn't break
    return NextResponse.json({ 
      repositories: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      },
      error: error.message,
      needsInstallation: true 
    });
  }
}
