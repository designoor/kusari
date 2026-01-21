'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import styles from './error.module.css';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Icon name="alertTriangle" size="xl" aria-hidden />
        </div>
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.message}>
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className={styles.actions}>
          <Button
            onClick={reset}
            variant="primary"
            leftIcon={<Icon name="refresh" size="sm" />}
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="secondary"
          >
            Go home
          </Button>
        </div>
        {error.digest && (
          <p className={styles.digest}>Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
