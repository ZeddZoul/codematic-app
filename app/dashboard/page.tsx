import { redirect } from 'next/navigation';
import { fetchDashboardStatsServer, fetchUserServer } from '@/lib/server-data';
import { DashboardClient } from './DashboardClient';

/**
 * Route segment configuration
 * Dynamic rendering with revalidation for authenticated pages
 * Revalidate every 2 minutes (120 seconds) for cached data
 */
export const dynamic = 'force-dynamic';
export const revalidate = 120;

/**
 * Dashboard Page - Server Component
 * Fetches initial data on the server for faster initial page load
 * Passes data to client component for interactivity
 * Uses ISR with 2-minute revalidation for optimal performance
 */
export default async function DashboardPage() {
  // Fetch user on server - redirect if not authenticated
  const user = await fetchUserServer();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch dashboard stats on server for initial render
  const stats = await fetchDashboardStatsServer();

  return <DashboardClient initialUser={user} initialStats={stats || undefined} />;
}
