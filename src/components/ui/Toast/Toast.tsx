'use client';

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from '../Icon';
import styles from './Toast.module.css';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const variantIcons: Record<ToastVariant, IconName> = {
  success: 'check',
  error: 'x',
  warning: 'alertTriangle',
  info: 'info',
};

// Error and warning toasts are urgent (assertive), success and info are polite
const isUrgentVariant = (variant: ToastVariant): boolean =>
  variant === 'error' || variant === 'warning';

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const { id, message, variant, duration = 5000, action } = toast;

  const handleDismiss = useCallback(() => {
    onDismiss(id);
  }, [id, onDismiss]);

  useEffect(() => {
    if (duration === 0) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  const urgent = isUrgentVariant(variant);

  return (
    <div
      className={`${styles.toast} ${styles[variant]}`}
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
    >
      <span className={styles.icon}>
        <Icon name={variantIcons[variant]} size="sm" />
      </span>
      <span className={styles.message}>{message}</span>
      {action && (
        <button
          type="button"
          className={styles.actionButton}
          onClick={() => {
            action.onClick();
            handleDismiss();
          }}
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        className={styles.closeButton}
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <Icon name="x" size="sm" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (typeof window === 'undefined') return null;
  if (toasts.length === 0) return null;

  return createPortal(
    <div className={styles.container} aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
};
