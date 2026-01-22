'use client';

/**
 * Custom hook for managing user preferences
 * Provides reactive access to preferences with localStorage persistence
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getHideMessagePreviews,
  setHideMessagePreviews as saveHideMessagePreviews,
} from '@/lib/preferences/storage';

export interface PreferencesState {
  /** Whether state is still loading from localStorage */
  isLoading: boolean;
  /** Whether message previews should be hidden in conversation list */
  hideMessagePreviews: boolean;
  /** Toggle hide message previews setting */
  setHideMessagePreviews: (hide: boolean) => void;
}

export function usePreferences(): PreferencesState {
  const [isLoading, setIsLoading] = useState(true);
  const [hideMessagePreviews, setHideMessagePreviewsState] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    setHideMessagePreviewsState(getHideMessagePreviews());
    setIsLoading(false);
  }, []);

  // Update hide message previews
  const setHideMessagePreviews = useCallback((hide: boolean) => {
    saveHideMessagePreviews(hide);
    setHideMessagePreviewsState(hide);
  }, []);

  return {
    isLoading,
    hideMessagePreviews,
    setHideMessagePreviews,
  };
}
