/**
 * Onboarding state management using localStorage
 * Tracks completion status and current step for the onboarding flow
 */

const STORAGE_KEY_COMPLETE = 'kusari_onboarding_complete';
const STORAGE_KEY_STEP = 'kusari_onboarding_step';

/** Maximum valid step index (0-based) */
const MAX_STEP_INDEX = 2;

/**
 * Check if the user has completed the onboarding flow
 */
export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false;

  const value = localStorage.getItem(STORAGE_KEY_COMPLETE);
  return value === 'true';
}

/**
 * Mark the onboarding flow as complete
 */
export function setOnboardingComplete(): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEY_COMPLETE, 'true');
}

/**
 * Get the current step index (0-based)
 * Returns 0 (welcome step) by default
 * Values are clamped to valid range [0, MAX_STEP_INDEX]
 */
export function getCurrentStep(): number {
  if (typeof window === 'undefined') return 0;

  const value = localStorage.getItem(STORAGE_KEY_STEP);
  if (!value) return 0;

  const step = parseInt(value, 10);
  if (isNaN(step)) return 0;

  return Math.max(0, Math.min(step, MAX_STEP_INDEX));
}

/**
 * Set the current step index (0-based)
 * Values are clamped to valid range [0, MAX_STEP_INDEX]
 * @param stepIndex - The step index to save
 */
export function setCurrentStep(stepIndex: number): void {
  if (typeof window === 'undefined') return;

  const clampedIndex = Math.max(0, Math.min(stepIndex, MAX_STEP_INDEX));
  localStorage.setItem(STORAGE_KEY_STEP, clampedIndex.toString());
}

/**
 * Clear all onboarding state from localStorage
 * Useful for testing or when a user wants to restart onboarding
 */
export function clearOnboardingState(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEY_COMPLETE);
  localStorage.removeItem(STORAGE_KEY_STEP);
}
