'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/hooks/useAppState';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';

interface AuthGuardContentProps {
  children: React.ReactNode;
}

/**
 * AuthGuard content - client-only component (no SSR).
 *
 * Protects routes requiring authentication. Redirects to landing page
 * if not authenticated. Since this is dynamically imported with ssr: false,
 * there's no hydration mismatch to worry about.
 */
export default function AuthGuardContent({ children }: AuthGuardContentProps) {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAppState();

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/');
    }
  }, [isReady, isAuthenticated, router]);

  // Show skeleton while loading or if not authenticated
  if (!isReady || !isAuthenticated) {
    return <AppShellSkeleton />;
  }

  return <>{children}</>;
}
