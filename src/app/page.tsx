'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow, OnboardingSkeleton } from '@/components/onboarding';
import { AppShellSkeleton } from '@/components/layout/AppShellSkeleton';
import { useOnboardingState } from '@/hooks/useOnboardingState';

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
  const { isLoading, isComplete } = useOnboardingState();

  // Redirect to chat if onboarding is complete
  useEffect(() => {
    if (!isLoading && isComplete) {
      router.push('/chat');
    }
  }, [isLoading, isComplete, router]);

  // Show app skeleton when redirecting (seamless transition to /chat)
  if (isComplete) {
    return <AppShellSkeleton />;
  }

  // Show onboarding skeleton while checking localStorage state
  if (isLoading) {
    return <OnboardingSkeleton />;
  }

  // Show onboarding flow for new or incomplete users
  return <OnboardingFlow />;
}
