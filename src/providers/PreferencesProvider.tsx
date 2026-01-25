'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import {
  getHideMessagePreviews,
  setHideMessagePreviews as saveHideMessagePreviews,
  getDisableReadReceipts,
  setDisableReadReceipts as saveDisableReadReceipts,
} from '@/lib/preferences/storage';

/**
 * Context value for preferences
 */
interface PreferencesContextValue {
  /** Whether state is still loading from localStorage */
  isLoading: boolean;
  /** Whether message previews should be hidden in conversation list */
  hideMessagePreviews: boolean;
  /** Toggle hide message previews setting */
  setHideMessagePreviews: (hide: boolean) => void;
  /** Whether read receipts are disabled (privacy setting) */
  disableReadReceipts: boolean;
  /** Toggle disable read receipts setting */
  setDisableReadReceipts: (disable: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/**
 * Hook to access preferences from the provider.
 * Must be used within a PreferencesProvider.
 *
 * @returns Preferences state and setters
 * @throws Error if used outside of PreferencesProvider
 */
export function usePreferencesContext(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within PreferencesProvider');
  }
  return context;
}

/**
 * Provider that manages user preferences at the app level.
 *
 * This provider ensures preferences are loaded once and persist across
 * page navigations, preventing "Message hidden" flashing during navigation.
 */
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hideMessagePreviews, setHideMessagePreviewsState] = useState(false);
  const [disableReadReceipts, setDisableReadReceiptsState] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setHideMessagePreviewsState(getHideMessagePreviews());
    setDisableReadReceiptsState(getDisableReadReceipts());
    setIsLoading(false);
  }, []);

  // Update hide message previews
  const setHideMessagePreviews = useCallback((hide: boolean) => {
    saveHideMessagePreviews(hide);
    setHideMessagePreviewsState(hide);
  }, []);

  // Update disable read receipts
  const setDisableReadReceipts = useCallback((disable: boolean) => {
    saveDisableReadReceipts(disable);
    setDisableReadReceiptsState(disable);
  }, []);

  const value = React.useMemo(
    () => ({
      isLoading,
      hideMessagePreviews,
      setHideMessagePreviews,
      disableReadReceipts,
      setDisableReadReceipts,
    }),
    [isLoading, hideMessagePreviews, setHideMessagePreviews, disableReadReceipts, setDisableReadReceipts]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
