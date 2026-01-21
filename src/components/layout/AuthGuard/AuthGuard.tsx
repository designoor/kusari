'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useWallet } from '@/hooks/useWallet';
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
 * Checks if the user has completed onboarding (wallet connected + XMTP enabled)
 * AND verifies that the wallet is currently connected.
 * If either condition fails, redirects to the landing page.
 *
 * Shows a loading skeleton while checking authentication state.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { isLoading, isComplete, reset } = useOnboardingState();
  const { isConnected } = useWallet();
  const wasConnectedRef = useRef<boolean | null>(null);

  // Track wallet disconnection and reset onboarding state
  // Note: This effect only handles state cleanup. The redirect is handled by the effect below.
  useEffect(() => {
    // Skip during initial loading
    if (isLoading) return;

    // Initialize the ref on first render after loading
    if (wasConnectedRef.current === null) {
      wasConnectedRef.current = isConnected;
      return;
    }

    // Detect disconnection: was connected, now disconnected
    if (wasConnectedRef.current && !isConnected) {
      reset(); // Clear onboarding state so user must re-onboard
    }

    wasConnectedRef.current = isConnected;
  }, [isConnected, isLoading, reset]);

  // Redirect if onboarding not complete or wallet not connected
  useEffect(() => {
    if (!isLoading && (!isComplete || !isConnected)) {
      router.replace('/');
    }
  }, [isLoading, isComplete, isConnected, router]);

  // Show loading state while checking or if conditions not met
  if (isLoading || !isComplete || !isConnected) {
    return <LoadingSkeleton />;
  }

  return <>{children}</>;
};
