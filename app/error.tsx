'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-system';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error to console when error changes
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.subtle }}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4" style={{ color: colors.text.primary }}>
          Something went wrong!
        </h2>
        <Button onClick={() => reset()} variant="primary">
          Try again
        </Button>
      </div>
    </div>
  );
}
