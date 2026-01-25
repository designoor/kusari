'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track page visibility state
 * Uses the Page Visibility API to detect when the tab is hidden/visible
 */
export function usePageVisibility(): { isVisible: boolean } {
  const [isVisible, setIsVisible] = useState(() => {
    // SSR safety: default to visible
    if (typeof document === 'undefined') return true;
    return !document.hidden;
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isVisible };
}
