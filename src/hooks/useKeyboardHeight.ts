'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface KeyboardState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  viewportHeight: number;
  viewportOffset: number;
}

/**
 * Hook to detect mobile keyboard visibility and height using the Visual Viewport API.
 * Returns the keyboard height and whether the keyboard is currently open.
 *
 * This works by comparing the visual viewport height to the layout viewport height.
 * When the keyboard opens, the visual viewport shrinks while the layout viewport stays the same.
 *
 * Also sets CSS custom properties on document.documentElement:
 * - --visual-viewport-height: the visible height
 * - --visual-viewport-offset: the scroll offset (non-zero when keyboard pushes content up)
 */
export function useKeyboardHeight(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isKeyboardOpen: false,
    keyboardHeight: 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    viewportOffset: 0,
  });

  // Track if we've set the CSS variables so we can clean them up
  const hasCssVarsRef = useRef(false);

  const updateViewport = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const visualViewport = window.visualViewport;
    const visualViewportHeight = visualViewport?.height ?? window.innerHeight;
    const visualViewportOffset = visualViewport?.offsetTop ?? 0;
    const layoutViewportHeight = window.innerHeight;

    // Set CSS custom properties for visual viewport dimensions
    document.documentElement.style.setProperty(
      '--visual-viewport-height',
      `${visualViewportHeight}px`
    );
    document.documentElement.style.setProperty(
      '--visual-viewport-offset',
      `${visualViewportOffset}px`
    );
    hasCssVarsRef.current = true;

    // Calculate the difference - this is approximately the keyboard height
    // We use a threshold of 150px to distinguish keyboard from minor viewport changes
    const heightDiff = layoutViewportHeight - visualViewportHeight;
    const isKeyboardOpen = heightDiff > 150;

    setState({
      isKeyboardOpen,
      keyboardHeight: isKeyboardOpen ? heightDiff : 0,
      viewportHeight: visualViewportHeight,
      viewportOffset: visualViewportOffset,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    // Initial check
    updateViewport();

    const visualViewport = window.visualViewport;

    if (visualViewport) {
      // Listen to viewport resize events (includes keyboard show/hide)
      visualViewport.addEventListener('resize', updateViewport);
      visualViewport.addEventListener('scroll', updateViewport);
    }

    // Also listen to window resize for fallback
    window.addEventListener('resize', updateViewport);

    return () => {
      if (visualViewport) {
        visualViewport.removeEventListener('resize', updateViewport);
        visualViewport.removeEventListener('scroll', updateViewport);
      }
      window.removeEventListener('resize', updateViewport);

      // Clean up CSS variables
      if (hasCssVarsRef.current) {
        document.documentElement.style.removeProperty('--visual-viewport-height');
        document.documentElement.style.removeProperty('--visual-viewport-offset');
      }
    };
  }, [updateViewport]);

  return state;
}
