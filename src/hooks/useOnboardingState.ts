import { useCallback, useEffect, useState } from 'react';
import {
  isOnboardingComplete,
  setOnboardingComplete,
  getCurrentStep,
  setCurrentStep,
  clearOnboardingState,
} from '@/lib/onboarding/storage';

/**
 * Onboarding step names
 */
export type OnboardingStep = 'welcome' | 'connect' | 'sign';

/**
 * Map of step indices to step names
 */
const STEPS: OnboardingStep[] = ['welcome', 'connect', 'sign'];

/**
 * Onboarding state interface
 */
export interface OnboardingState {
  /** Whether state is still loading from localStorage */
  isLoading: boolean;
  /** Whether onboarding has been completed */
  isComplete: boolean;
  /** Current step name */
  currentStep: OnboardingStep;
  /** Current step index (0-based) */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Move to the next step */
  nextStep: () => void;
  /** Move to the previous step */
  prevStep: () => void;
  /** Mark onboarding as complete */
  completeOnboarding: () => void;
  /** Clear onboarding state (for testing/reset) */
  reset: () => void;
}

/**
 * Custom hook for managing onboarding flow state
 *
 * This hook manages the 3-step onboarding flow:
 * 1. Welcome - Introduction to the app
 * 2. Connect - Connect wallet via WalletConnect
 * 3. Sign - Sign message to enable XMTP
 *
 * State is persisted to localStorage so users can resume where they left off.
 *
 * @example
 * ```tsx
 * function OnboardingFlow() {
 *   const { isLoading, currentStep, nextStep, prevStep, completeOnboarding } = useOnboardingState();
 *
 *   if (isLoading) {
 *     return <AppShellSkeleton />;
 *   }
 *
 *   return (
 *     <div>
 *       {currentStep === 'welcome' && <WelcomeStep onNext={nextStep} />}
 *       {currentStep === 'connect' && <ConnectStep onNext={nextStep} onBack={prevStep} />}
 *       {currentStep === 'sign' && <SignStep onComplete={completeOnboarding} onBack={prevStep} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useOnboardingState(): OnboardingState {
  // Initialize state from localStorage
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [stepIndex, setStepIndexState] = useState(0);

  // Load state from localStorage on mount
  useEffect(() => {
    setIsComplete(isOnboardingComplete());
    setStepIndexState(getCurrentStep());
    setIsLoading(false);
  }, []);

  // Get current step name
  const currentStep = STEPS[stepIndex] || 'welcome';

  // Move to next step
  const nextStep = useCallback(() => {
    setStepIndexState((prev) => {
      if (prev >= STEPS.length - 1) return prev;
      const newIndex = prev + 1;
      setCurrentStep(newIndex);
      return newIndex;
    });
  }, []);

  // Move to previous step
  const prevStep = useCallback(() => {
    setStepIndexState((prev) => {
      if (prev <= 0) return prev;
      const newIndex = prev - 1;
      setCurrentStep(newIndex);
      return newIndex;
    });
  }, []);

  // Mark onboarding as complete
  const completeOnboarding = useCallback(() => {
    setOnboardingComplete();
    setIsComplete(true);
  }, []);

  // Reset onboarding state
  const reset = useCallback(() => {
    clearOnboardingState();
    setIsComplete(false);
    setStepIndexState(0);
  }, []);

  return {
    isLoading,
    isComplete,
    currentStep,
    stepIndex,
    totalSteps: STEPS.length,
    nextStep,
    prevStep,
    completeOnboarding,
    reset,
  };
}
