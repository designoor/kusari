'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingState } from '@/hooks/useOnboardingState';
import { OnboardingSkeleton } from '../OnboardingSkeleton';
import { StepIndicator } from '../StepIndicator';
import { WelcomeStep } from '../WelcomeStep';
import { ConnectWalletStep } from '../ConnectWalletStep';
import { SignMessageStep } from '../SignMessageStep';
import styles from './OnboardingFlow.module.css';

export interface OnboardingFlowProps {
  onComplete?: () => void;
}

/**
 * Main onboarding flow container
 * Manages the multi-step onboarding process:
 * 1. Welcome - Introduction to Kusari
 * 2. Connect - Connect wallet via WalletConnect
 * 3. Sign - Sign message to enable XMTP
 */
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
}) => {
  const router = useRouter();
  const {
    isLoading,
    currentStep,
    stepIndex,
    totalSteps,
    nextStep,
    prevStep,
    completeOnboarding,
  } = useOnboardingState();

  const handleComplete = () => {
    completeOnboarding();

    if (onComplete) {
      onComplete();
    } else {
      router.push('/chat');
    }
  };

  // Show loading skeleton while state is being loaded
  if (isLoading) {
    return <OnboardingSkeleton />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.stepContent}>
          {currentStep === 'welcome' && <WelcomeStep onNext={nextStep} />}

          {currentStep === 'connect' && (
            <ConnectWalletStep onNext={nextStep} onBack={prevStep} />
          )}

          {currentStep === 'sign' && (
            <SignMessageStep onComplete={handleComplete} onBack={prevStep} />
          )}
        </div>

        <div className={styles.stepIndicatorWrapper}>
          <StepIndicator currentStep={stepIndex} totalSteps={totalSteps} />
        </div>
      </div>
    </div>
  );
};
