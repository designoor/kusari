'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingFlow } from '@/components/onboarding';
import { useOnboardingState } from '@/hooks/useOnboardingState';

export default function Home() {
  const router = useRouter();
  const { isLoading, isComplete } = useOnboardingState();

  useEffect(() => {
    if (!isLoading && isComplete) {
      router.push('/chat');
    }
  }, [isLoading, isComplete, router]);

  if (isLoading) {
    return null;
  }

  if (isComplete) {
    return null;
  }

  return <OnboardingFlow />;
}
