'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { OnboardingStep } from '@/hooks/useAppState';
import { StepIndicator } from '../StepIndicator';
import { WelcomeStep } from '../WelcomeStep';
import { ConnectWalletStep } from '../ConnectWalletStep';
import { SignMessageStep } from '../SignMessageStep';
import styles from './OnboardingFlow.module.css';

// Map step names to indices for the step indicator
const STEP_INDEX: Record<OnboardingStep, number> = {
  welcome: 0,
  connect: 1,
  sign: 2,
};

const TOTAL_STEPS = 3;

export interface OnboardingFlowProps {
  /** Current step derived from app state */
  currentStep: OnboardingStep;
  /** Optional callback for testing */
  onComplete?: () => void;
}

/**
 * Main onboarding flow container
 *
 * Steps are now reactive to SDK state changes:
 * - welcome: Shown when wallet not connected
 * - connect: Shown when wallet is connecting
 * - sign: Shown when wallet connected but XMTP not initialized
 *
 * Navigation is implicit - step changes when SDK state changes.
 */
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  currentStep,
  onComplete,
}) => {
  const router = useRouter();

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.push('/chat');
    }
  };

  const stepIndex = STEP_INDEX[currentStep];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.stepContent}>
          {currentStep === 'welcome' && <WelcomeStep />}

          {currentStep === 'connect' && <ConnectWalletStep />}

          {currentStep === 'sign' && (
            <SignMessageStep onComplete={handleComplete} />
          )}
        </div>

        <div className={styles.stepIndicatorWrapper}>
          <StepIndicator currentStep={stepIndex} totalSteps={TOTAL_STEPS} />
        </div>
      </div>
    </div>
  );
};
