import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Cache user data for 5 minutes
  // User data changes infrequently, so longer cache is safe
  return NextResponse.json(session.user, {
    headers: {
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
    },
  });
}
