'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import styles from './settings.module.css';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function SettingsError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Settings error:', error);
  }, [error]);

  return (
    <div className={styles.errorContainer}>
      <ErrorState
        title="Failed to load settings"
        message={error.message || 'Unable to load settings. Please try again.'}
        onRetry={reset}
      />
    </div>
  );
}
