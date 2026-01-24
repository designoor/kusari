'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/hooks/useAppState';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component that protects routes requiring authentication.
 *
 * Uses unified app state to check if user is fully authenticated
 * (wallet connected + XMTP initialized). Redirects to landing page
 * if authentication requirements are not met.
 *
 * Shows a loading skeleton while checking authentication state.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { isReady, isAuthenticated } = useAppState();

  // Redirect to landing page if not authenticated (includes wallet disconnect)
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace('/');
    }
  }, [isReady, isAuthenticated, router]);

  // Show skeleton during initialization or if not authenticated
  if (!isReady || !isAuthenticated) {
    return <AppShellSkeleton />;
  }

  return <>{children}</>;
};
