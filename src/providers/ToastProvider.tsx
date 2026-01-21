'use client';

import React, { createContext, useContext, useCallback, useState, useMemo } from 'react';
import { ToastContainer, type ToastData, type ToastVariant } from '@/components/ui/Toast';

type ToastOptions = {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (message: string, variant: ToastVariant, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function generateToastId(): string {
  return crypto.randomUUID?.() ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant, options?: ToastOptions): string => {
      const id = generateToastId();
      const toast: ToastData = {
        id,
        message,
        variant,
        duration: options?.duration,
        action: options?.action,
      };
      setToasts((prev) => [...prev, toast]);
      return id;
    },
    []
  );

  const success = useCallback(
    (message: string, options?: ToastOptions) => addToast(message, 'success', options),
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => addToast(message, 'error', options),
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => addToast(message, 'warning', options),
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => addToast(message, 'info', options),
    [addToast]
  );

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, addToast, removeToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
