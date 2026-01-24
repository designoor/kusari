'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow } from '@/components/onboarding';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import { useAppState } from '@/hooks/useAppState';

/**
 * Home page content - client-only component (no SSR).
 *
 * Handles onboarding flow and redirects to chat when authenticated.
 * Since this is dynamically imported with ssr: false, there's no
 * hydration mismatch to worry about.
 */
export default function HomeContent() {
  const router = useRouter();
  const { isReady, isAuthenticated, onboardingStep } = useAppState();

  // Redirect to chat when fully authenticated
  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.push('/chat');
    }
  }, [isReady, isAuthenticated, router]);

  // Show skeleton while loading or redirecting
  if (!isReady || isAuthenticated || !onboardingStep) {
    return <AppShellSkeleton />;
  }

  // Show onboarding flow for all non-authenticated states
  return <OnboardingFlow currentStep={onboardingStep} />;
}
