'use client';

import { useState, useEffect, useCallback } from 'react';

interface KeyboardState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  viewportHeight: number;
}

/**
 * Hook to detect mobile keyboard visibility and height using the Visual Viewport API.
 * Returns the keyboard height and whether the keyboard is currently open.
 *
 * This works by comparing the visual viewport height to the layout viewport height.
 * When the keyboard opens, the visual viewport shrinks while the layout viewport stays the same.
 */
export function useKeyboardHeight(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isKeyboardOpen: false,
    keyboardHeight: 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const visualViewport = window.visualViewport;
    const layoutViewportHeight = window.innerHeight;
    const visualViewportHeight = visualViewport.height;

    // Calculate the difference - this is approximately the keyboard height
    // We use a threshold of 150px to distinguish keyboard from minor viewport changes
    const heightDiff = layoutViewportHeight - visualViewportHeight;
    const isKeyboardOpen = heightDiff > 150;

    setState({
      isKeyboardOpen,
      keyboardHeight: isKeyboardOpen ? heightDiff : 0,
      viewportHeight: visualViewportHeight,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const visualViewport = window.visualViewport;

    // Initial check
    updateViewport();

    // Listen to viewport resize events (includes keyboard show/hide)
    visualViewport.addEventListener('resize', updateViewport);
    visualViewport.addEventListener('scroll', updateViewport);

    // Also listen to window resize for fallback
    window.addEventListener('resize', updateViewport);

    return () => {
      visualViewport.removeEventListener('resize', updateViewport);
      visualViewport.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, [updateViewport]);

  return state;
}
