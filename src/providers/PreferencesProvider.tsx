'use client';

/**
 * PreferencesProvider - App-wide preferences context
 * Provides reactive access to user preferences throughout the app
 * without prop drilling
 */

import { createContext, useContext } from 'react';
import { usePreferences, type PreferencesState } from '@/hooks/usePreferences';

const PreferencesContext = createContext<PreferencesState | null>(null);

/**
 * Hook to access preferences context
 * Throws if used outside PreferencesProvider
 */
export function usePreferencesContext(): PreferencesState {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferencesContext must be used within PreferencesProvider');
  }
  return context;
}

/**
 * Safe version that returns null if used outside provider
 * Useful for hooks that need to work both with and without the provider
 */
export function usePreferencesContextSafe(): PreferencesState | null {
  return useContext(PreferencesContext);
}

export interface PreferencesProviderProps {
  children: React.ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  // usePreferences() returns a memoized object with stable reference
  const preferences = usePreferences();

  return (
    <PreferencesContext.Provider value={preferences}>
      {children}
    </PreferencesContext.Provider>
  );
}
