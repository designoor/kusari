'use client';

/**
 * Custom hook for managing user preferences
 * Provides reactive access to preferences with localStorage persistence
 *
 * This hook consumes from PreferencesProvider to ensure preferences
 * are loaded once and persist across page navigations.
 */

import { usePreferencesContext } from '@/providers/PreferencesProvider';

export interface PreferencesState {
  /** Whether state is still loading from localStorage */
  isLoading: boolean;
  /** Whether message previews should be hidden in conversation list */
  hideMessagePreviews: boolean;
  /** Toggle hide message previews setting */
  setHideMessagePreviews: (hide: boolean) => void;
}

export function usePreferences(): PreferencesState {
  return usePreferencesContext();
}
