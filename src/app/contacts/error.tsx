'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import styles from './contacts.module.css';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ContactsError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Contacts error:', error);
  }, [error]);

  return (
    <div className={styles.errorContainer}>
      <ErrorState
        title="Failed to load contacts"
        message={error.message || 'Unable to load your contacts. Please try again.'}
        onRetry={reset}
      />
    </div>
  );
}
