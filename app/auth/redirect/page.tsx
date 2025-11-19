'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/design-system';

export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    fetch('/api/v1/user/me')
      .then((res) => {
        if (res.ok) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background.subtle }}>
      <div className="text-center">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
          style={{ borderColor: colors.primary.accent }}
        ></div>
        <p style={{ color: colors.text.secondary }}>Authenticating...</p>
      </div>
    </div>
  );
}
