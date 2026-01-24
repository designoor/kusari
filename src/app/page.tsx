'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow } from '@/components/onboarding';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import { useAppState } from '@/hooks/useAppState';

/**
 * Landing page - handles onboarding flow and redirects
 *
 * Uses unified app state to determine:
 * 1. Show skeleton during initialization (AppKit hydrating)
 * 2. Redirect to /chat when fully authenticated
 * 3. Show onboarding flow with appropriate step based on SDK states
 *
 * State derivation eliminates localStorage dependency and prevents
 * flash during page refresh.
 */
export default function Home() {
  const router = useRouter();
  const { isReady, isAuthenticated, onboardingStep } = useAppState();

  // Redirect to chat when fully authenticated
  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.push('/chat');
    }
  }, [isReady, isAuthenticated, router]);

  // Show skeleton during initialization or while redirecting
  if (!isReady || isAuthenticated || !onboardingStep) {
    return <AppShellSkeleton />;
  }

  // Show onboarding flow for all non-authenticated states
  return <OnboardingFlow currentStep={onboardingStep} />;
}
