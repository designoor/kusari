'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import styles from './chat.module.css';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChatError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Chat error:', error);
  }, [error]);

  return (
    <div className={styles.errorContainer}>
      <ErrorState
        title="Failed to load chat"
        message={error.message || 'Unable to load your conversations. Please try again.'}
        onRetry={reset}
      />
    </div>
  );
}
