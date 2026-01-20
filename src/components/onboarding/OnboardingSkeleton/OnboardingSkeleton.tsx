import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './OnboardingSkeleton.module.css';

/**
 * A subtle loading skeleton for the onboarding flow.
 * Displays a centered card with placeholder content while
 * the onboarding state is being loaded from localStorage.
 */
export const OnboardingSkeleton: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Step indicator placeholder */}
        <div className={styles.stepIndicator}>
          <Skeleton variant="circular" width={8} height={8} />
          <Skeleton variant="circular" width={8} height={8} />
          <Skeleton variant="circular" width={8} height={8} />
        </div>

        {/* Title placeholder */}
        <Skeleton
          variant="text"
          width="60%"
          height={28}
          className={styles.title}
        />

        {/* Description placeholder */}
        <div className={styles.description}>
          <Skeleton variant="text" width="90%" height={16} />
          <Skeleton variant="text" width="75%" height={16} />
        </div>

        {/* Button placeholder */}
        <Skeleton
          variant="rectangular"
          width="100%"
          height={48}
          className={styles.button}
        />
      </div>
    </div>
  );
};
