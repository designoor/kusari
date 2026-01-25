'use client';

import { useMemo } from 'react';
import { useWalletConnection } from './useWalletConnection';
import { useXmtpContext } from '@/providers/XmtpProvider';

/**
 * Discriminated union representing all possible application states.
 * Each state has a unique `status` field for type narrowing.
 */
export type AppState =
  | { status: 'initializing' }
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'needs-xmtp'; address: string }
  | { status: 'initializing-xmtp'; address: string }
  | { status: 'ready'; address: string };

/**
 * Derived onboarding step based on app state.
 * Maps directly to the UI components to render.
 */
export type OnboardingStep = 'welcome' | 'connect' | 'sign';

/**
 * Return type for the useAppState hook.
 */
export interface AppStateResult {
  /** Current discriminated app state */
  state: AppState;

  /** True when state is definitively known (not initializing) */
  isReady: boolean;

  /** True when fully authenticated (wallet + XMTP) */
  isAuthenticated: boolean;

  /** Derived onboarding step for UI rendering */
  onboardingStep: OnboardingStep | null;

  /** Wallet address when available */
  address: string | undefined;

  /** XMTP error if initialization failed */
  xmtpError: Error | null;
}

/**
 * Unified application state hook - the single source of truth for app state.
 *
 * This hook is the ultimate decision maker for whether the UI is ready.
 * It aggregates wallet connection state (from AppKit) and XMTP client state
 * to provide a single source of truth for application routing and UI decisions.
 *
 * Loading states (show skeleton):
 * - AppKit initializing (core SDK hydrating)
 * - AppKit reconnecting (restoring wallet session)
 * - AppKit connecting (user-initiated connection)
 * - XMTP collecting state (wallet connected, waiting for auto-init attempt)
 *
 * Ready states (show appropriate UI):
 * - Wallet disconnected → Welcome step
 * - Wallet connected, XMTP not initialized → Sign step
 * - Wallet connected, XMTP initialized → Chat app
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { state, isReady, isAuthenticated, onboardingStep } = useAppState();
 *
 *   // Show skeleton while loading
 *   if (!isReady) {
 *     return <AppShellSkeleton />;
 *   }
 *
 *   // Show chat app when authenticated
 *   if (isAuthenticated) {
 *     return <ChatApp />;
 *   }
 *
 *   // Show onboarding flow
 *   return <OnboardingFlow currentStep={onboardingStep!} />;
 * }
 * ```
 */
export function useAppState(): AppStateResult {
  const wallet = useWalletConnection();
  const xmtp = useXmtpContext();

  // Derive the canonical app state from wallet + XMTP state
  const state = useMemo((): AppState => {
    // Loading = still collecting state from SDKs
    // 1. AppKit still initializing, reconnecting, or connecting
    // 2. Wallet connected, but XMTP identity check hasn't completed yet
    const isLoading =
      wallet.isLoading || (wallet.isConnected && !xmtp.hasAttemptedAutoInit);

    if (isLoading) {
      return { status: 'initializing' };
    }

    // User actively connecting wallet (show connect step)
    if (wallet.status === 'connecting') {
      return { status: 'connecting' };
    }

    // Wallet not connected (show welcome step)
    if (!wallet.isConnected || !wallet.address) {
      return { status: 'disconnected' };
    }

    // At this point, wallet IS connected with a valid address
    const address = wallet.address;

    // XMTP currently initializing (show sign step with loading)
    if (xmtp.isInitializing) {
      return { status: 'initializing-xmtp', address };
    }

    // XMTP not initialized (show sign step)
    if (!xmtp.isInitialized) {
      return { status: 'needs-xmtp', address };
    }

    // Fully authenticated (show chat app)
    return { status: 'ready', address };
  }, [
    wallet.isLoading,
    wallet.status,
    wallet.isConnected,
    wallet.address,
    xmtp.hasAttemptedAutoInit,
    xmtp.isInitializing,
    xmtp.isInitialized,
  ]);

  // Derive onboarding step from app state
  const getOnboardingStep = (): OnboardingStep | null => {
    switch (state.status) {
      case 'disconnected':
        return 'welcome';
      case 'connecting':
        return 'connect';
      case 'needs-xmtp':
      case 'initializing-xmtp':
        return 'sign';
      case 'initializing':
      case 'ready':
        return null;
    }
  };

  return {
    state,
    isReady: state.status !== 'initializing',
    isAuthenticated: state.status === 'ready',
    onboardingStep: getOnboardingStep(),
    address: 'address' in state ? state.address : undefined,
    xmtpError: xmtp.error,
  };
}
