import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      console.log(`[Progress API] Unauthorized access attempt for id: ${params.id}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    console.log(`[Progress API] Looking for checkRunId: ${id}`);

    const checkRun = await prisma.checkRun.findUnique({
      where: { id },
    });

    if (!checkRun) {
      console.log(`[Progress API] CheckRun not found in database: ${id}`);
      
      // Let's also check if there are any checkRuns at all to debug
      const allCheckRuns = await prisma.checkRun.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, status: true }
      });
      console.log(`[Progress API] Recent checkRuns in database:`, allCheckRuns);
      
      return NextResponse.json({ error: 'Check run not found' }, { status: 404 });
    }

    console.log(`[Progress API] Found checkRun: ${id}, status: ${checkRun.status}`);

    // Calculate progress based on status and timestamps
    let progress = 0;
    let currentStep = 'Starting analysis...';
    let fileCount = 0;

    switch (checkRun.status) {
      case 'IN_PROGRESS':
        // Estimate progress based on time elapsed
        const elapsed = Date.now() - checkRun.createdAt.getTime();
        const estimatedDuration = 20000; // 20 seconds estimated
        progress = Math.min(95, Math.floor((elapsed / estimatedDuration) * 100));
        
        // Set realistic step based on progress
        if (progress < 10) {
          currentStep = 'Starting analysis for repository...';
        } else if (progress < 25) {
          currentStep = 'Fetching repository files...';
        } else if (progress < 40) {
          currentStep = 'Running deterministic rules engine...';
        } else if (progress < 55) {
          currentStep = 'Found compliance violations, analyzing...';
        } else if (progress < 70) {
          currentStep = 'Running AI content validation...';
        } else if (progress < 85) {
          currentStep = 'Starting AI augmentation for issues...';
        } else {
          currentStep = 'AI analyzing violations and suggesting fixes...';
        }
        break;
        
      case 'COMPLETED':
        progress = 100;
        currentStep = 'Analysis complete! Preparing results...';
        if (checkRun.issues && Array.isArray(checkRun.issues)) {
          // Count unique files from issues
          const files = new Set();
          (checkRun.issues as any[]).forEach(issue => {
            if (issue.file) files.add(issue.file);
          });
          fileCount = files.size;
        }
        break;
        
      case 'FAILED':
        progress = 100;
        currentStep = 'Analysis failed. Please try again.';
        break;
        
      default:
        progress = 0;
        currentStep = 'Initializing...';
    }

    return NextResponse.json({
      status: checkRun.status,
      progress,
      currentStep,
      fileCount,
      createdAt: checkRun.createdAt,
      completedAt: checkRun.completedAt,
    });

  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}