'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './AuthGuard.module.css';

interface AuthGuardProps {
  children: React.ReactNode;
}

const LoadingSkeleton = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.loadingContent}>
      <Skeleton variant="rectangular" width="100%" height={56} />
      <div className={styles.loadingBody}>
        <Skeleton variant="rectangular" width={320} height="100%" />
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </div>
    </div>
  </div>
);

/**
 * AuthGuard component that protects routes requiring authentication.
 *
 * Checks if the user has completed onboarding (wallet connected + XMTP enabled).
 * If not, redirects to the landing page to complete onboarding.
 *
 * Shows a loading skeleton while checking authentication state.
 *
 * Note: This guard only checks localStorage for onboarding completion status.
 * It does not verify that the wallet or XMTP client are currently connected.
 * Child components (e.g., chat pages) are responsible for handling disconnected
 * state via their own hooks (useXmtpContext, useWallet, etc.).
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { isLoading, isComplete } = useOnboardingState();

  useEffect(() => {
    // Only redirect after loading is complete and we know user hasn't finished onboarding
    if (!isLoading && !isComplete) {
      router.replace('/');
    }
  }, [isLoading, isComplete, router]);

  // Show loading state while checking or redirecting
  if (isLoading || !isComplete) {
    return <LoadingSkeleton />;
  }

  return <>{children}</>;
};
