import React from 'react';
import styles from './StepIndicator.module.css';

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * Visual progress indicator for multi-step flows
 * Displays dots representing each step, with the current step highlighted
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className={styles.container} role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`
            ${styles.dot}
            ${index === currentStep ? styles.active : ''}
            ${index < currentStep ? styles.completed : ''}
          `}
          aria-label={`Step ${index + 1}${index === currentStep ? ' (current)' : index < currentStep ? ' (completed)' : ''}`}
        />
      ))}
    </div>
  );
};
