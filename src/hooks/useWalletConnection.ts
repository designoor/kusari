'use client';

import { useAppKitState, useAppKitAccount } from '@reown/appkit/react';

export type WalletConnectionStatus =
  | 'initializing' // AppKit not yet initialized
  | 'reconnecting' // Hydration/reconnection in progress
  | 'connecting' // User-initiated connection
  | 'connected' // Ready
  | 'disconnected'; // Not connected

export interface WalletConnectionState {
  /** Wallet connection status accounting for hydration */
  status: WalletConnectionStatus;
  /** True only when definitively connected (not during hydration) */
  isConnected: boolean;
  /** True during any indeterminate state (initializing, reconnecting, connecting) */
  isLoading: boolean;
  /** Wallet address when connected */
  address: string | undefined;
}

/**
 * Unified wallet connection hook using AppKit as the single source of truth.
 *
 * Handles SSR hydration gracefully by checking:
 * - `initialized` from useAppKitState (false during SSR hydration)
 * - `status` from useAppKitAccount (includes 'reconnecting' during wallet reconnection)
 *
 * CRITICAL: Never make routing decisions while `isLoading` is true.
 * This prevents redirect loops during hydration.
 */
export function useWalletConnection(): WalletConnectionState {
  const { initialized } = useAppKitState();
  const { address, isConnected, status: appKitStatus } = useAppKitAccount();

  let status: WalletConnectionStatus;

  if (!initialized) {
    // AppKit is still initializing (SSR hydration)
    status = 'initializing';
  } else if (appKitStatus === 'reconnecting') {
    // Wallet is reconnecting after page refresh
    status = 'reconnecting';
  } else if (appKitStatus === 'connecting') {
    // User-initiated connection in progress
    status = 'connecting';
  } else if (isConnected) {
    // Fully connected and ready
    status = 'connected';
  } else {
    // Not connected
    status = 'disconnected';
  }

  const isLoading =
    status === 'initializing' || status === 'reconnecting' || status === 'connecting';

  return {
    status,
    isConnected: status === 'connected',
    isLoading,
    address,
  };
}
