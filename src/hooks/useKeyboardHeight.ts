'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface KeyboardState {
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  viewportHeight: number;
  viewportOffset: number;
}

// Check if device is mobile/tablet (has touch and small screen)
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window &&
    window.innerWidth < 1024
  );
}

/**
 * Hook to detect mobile keyboard visibility and height.
 *
 * Uses two detection methods:
 * 1. Input focus events (immediate detection when input is focused)
 * 2. Visual Viewport API (for accurate height measurements)
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

  // Track if an input is focused (for immediate keyboard detection)
  const inputFocusedRef = useRef(false);
  // Track if we've set the CSS variables so we can clean them up
  const hasCssVarsRef = useRef(false);

  const updateViewport = useCallback((forceKeyboardOpen?: boolean) => {
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
    const heightDiff = layoutViewportHeight - visualViewportHeight;
    // Keyboard is open if: forced by focus event, OR height diff > 150px
    const isKeyboardOpen = forceKeyboardOpen === true || heightDiff > 150;

    setState({
      isKeyboardOpen,
      keyboardHeight: isKeyboardOpen ? Math.max(heightDiff, 0) : 0,
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
      visualViewport.addEventListener('resize', () => updateViewport(inputFocusedRef.current));
      visualViewport.addEventListener('scroll', () => updateViewport(inputFocusedRef.current));
    }

    // Also listen to window resize for fallback
    window.addEventListener('resize', () => updateViewport(inputFocusedRef.current));

    // Listen for input focus/blur to detect keyboard on mobile
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable;

      if (isInput && isMobileDevice()) {
        inputFocusedRef.current = true;
        // Immediately mark keyboard as open on focus
        updateViewport(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable;

      if (isInput && isMobileDevice()) {
        inputFocusedRef.current = false;
        // Small delay to let viewport update before checking
        setTimeout(() => updateViewport(false), 100);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      if (visualViewport) {
        visualViewport.removeEventListener('resize', () => updateViewport(inputFocusedRef.current));
        visualViewport.removeEventListener('scroll', () => updateViewport(inputFocusedRef.current));
      }
      window.removeEventListener('resize', () => updateViewport(inputFocusedRef.current));
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);

      // Clean up CSS variables
      if (hasCssVarsRef.current) {
        document.documentElement.style.removeProperty('--visual-viewport-height');
        document.documentElement.style.removeProperty('--visual-viewport-offset');
      }
    };
  }, [updateViewport]);

  return state;
}
