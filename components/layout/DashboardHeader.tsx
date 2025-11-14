/**
 * DashboardHeader - Server Component
 * Static header component that can be rendered on the server
 * No client-side interactivity needed
 */

import { colors } from '@/lib/design-system';

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2" style={{ color: colors.text.primary }}>
        Overview
      </h2>
      <p className="text-sm sm:text-base" style={{ color: colors.text.secondary }}>
        {userName ? `Welcome, ${userName}! Here's your compliance dashboard at a glance.` : 'Welcome! Here\'s your compliance dashboard at a glance.'}
      </p>
    </div>
  );
}
