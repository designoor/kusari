'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useXmtpContext } from '@/providers/XmtpProvider';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

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
  const { isLoading: onboardingLoading, isComplete, reset } = useOnboardingState();
  const { isConnected, isLoading: walletLoading } = useWalletConnection();
  const { isInitialized: isXmtpInitialized } = useXmtpContext();
  const wasConnectedRef = useRef<boolean | null>(null);

  // Track wallet disconnection and reset onboarding state
  // Note: This effect only handles state cleanup. The redirect is handled by the effect below.
  useEffect(() => {
    // Skip during any loading state
    if (onboardingLoading || walletLoading) return;

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
  }, [isConnected, onboardingLoading, walletLoading, reset]);

  // Redirect if onboarding not complete or wallet not connected
  // CRITICAL: Only redirect when wallet state is DEFINITIVELY known (not loading)
  useEffect(() => {
    if (onboardingLoading || walletLoading) return;
    if (!isComplete || !isConnected) {
      router.replace('/');
    }
  }, [onboardingLoading, walletLoading, isComplete, isConnected, router]);

  // Show loading state while checking or if conditions not met (including XMTP initialization)
  if (onboardingLoading || walletLoading || !isComplete || !isConnected || !isXmtpInitialized) {
    return <AppShellSkeleton />;
  }

  return <>{children}</>;
};
