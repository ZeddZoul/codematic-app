'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { ToastProvider } from "@/lib/hooks/useToast";
import { ToastContainer } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  // Get or create the QueryClient instance
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </QueryClientProvider>
  );
}
