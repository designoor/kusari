import React from 'react';
import { Button } from '../Button';
import { Icon } from '../Icon';
import styles from './ErrorState.module.css';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | null;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryLabel = 'Try again',
  className,
}) => {
  const errorMessage = message ?? error?.message ?? 'An unexpected error occurred. Please try again.';

  return (
    <div className={[styles.errorState, className].filter(Boolean).join(' ')} role="alert">
      <div className={styles.iconWrapper}>
        <Icon name="alertTriangle" size="xl" aria-hidden />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{errorMessage}</p>
      {onRetry && (
        <div className={styles.action}>
          <Button
            onClick={onRetry}
            variant="primary"
            leftIcon={<Icon name="refresh" size="sm" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
