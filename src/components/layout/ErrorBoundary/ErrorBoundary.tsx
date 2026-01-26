'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
  resetKey: number;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * Displays a fallback UI and allows users to retry.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, isRetrying: false, resetKey: 0 };
  }

  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, isRetrying: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ isRetrying: true });
    this.retryTimeoutId = setTimeout(() => {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        isRetrying: false,
        resetKey: prev.resetKey + 1,
      }));
    }, 500);
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    if (this.state.isRetrying) {
      return (
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.iconWrapperNeutral}>
              <Icon name="loader" size="lg" />
            </div>
            <h2 className={styles.title}>Retrying...</h2>
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.iconWrapper}>
              <Icon name="alertTriangle" size="lg" />
            </div>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>
              An unexpected error occurred. Please try again.
            </p>
            <div className={styles.actions}>
              <Button variant="primary" onClick={this.handleRetry}>
                Try again
              </Button>
              <Button variant="secondary" onClick={this.handleReload}>
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
