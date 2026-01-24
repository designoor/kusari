'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow, OnboardingSkeleton } from '@/components/onboarding';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { useWalletConnection } from '@/hooks/useWalletConnection';

/**
 * Landing page - handles onboarding flow and redirects
 *
 * Logic:
 * 1. Show loading skeleton while checking onboarding state
 * 2. If onboarding is complete, redirect to /chat
 * 3. Otherwise, show the onboarding flow
 *
 * Edge cases handled:
 * - SSR: isLoading starts as true, prevents flash
 * - Fast redirect: Shows skeleton while redirecting
 * - Resume: If user partially completed onboarding, they resume where they left off
 */
export default function Home() {
  const router = useRouter();
  const { isLoading: onboardingLoading, isComplete } = useOnboardingState();
  const { isConnected, isLoading: walletLoading } = useWalletConnection();

  // Redirect to chat if onboarding is complete AND wallet is connected
  // CRITICAL: Only redirect when wallet state is DEFINITIVELY known (not loading)
  useEffect(() => {
    if (onboardingLoading || walletLoading) return;
    if (isComplete && isConnected) {
      router.push('/chat');
    }
  }, [onboardingLoading, walletLoading, isComplete, isConnected, router]);

  // Show app skeleton when redirecting (seamless transition to /chat)
  if (!onboardingLoading && !walletLoading && isComplete && isConnected) {
    return <AppShellSkeleton />;
  }

  // Show onboarding skeleton while checking state
  if (onboardingLoading || walletLoading) {
    return <OnboardingSkeleton />;
  }

  // Show onboarding flow for new or incomplete users
  return <OnboardingFlow />;
}
