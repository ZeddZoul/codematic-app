import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

export interface User {
  id: string;
  githubId: string;
  login?: string;
  name: string;
  email: string;
  avatar_url?: string;
  avatarUrl?: string;
}

async function fetchUser(): Promise<User> {
  const response = await fetch('/api/v1/user/me');
  
  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  
  return response.json();
}

interface UseUserOptions {
  initialData?: User;
}

/**
 * Hook for fetching current user data
 * Uses standard stale time (5 minutes) as user data changes infrequently
 * Accepts initialData from Server Component for faster initial render
 */
export function useUser(options?: UseUserOptions) {
  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: options?.initialData,
  });
}
