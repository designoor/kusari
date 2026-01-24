'use client';

import { useAccount } from 'wagmi';
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
 * Unified wallet connection hook combining wagmi and AppKit state.
 *
 * Uses both wagmi's isReconnecting and AppKit's status for reliable
 * reconnection detection. The flash prevention is handled at the page
 * level with dynamic imports (ssr: false), so this hook can be simple.
 *
 * CRITICAL: Never make routing decisions while `isLoading` is true.
 * This prevents redirect loops during hydration.
 */
export function useWalletConnection(): WalletConnectionState {
  const { initialized, loading: appKitLoading } = useAppKitState();
  const { address, isConnected, status: appKitStatus } = useAppKitAccount();
  const { isReconnecting: wagmiIsReconnecting } = useAccount();

  let status: WalletConnectionStatus;

  if (!initialized || appKitLoading) {
    // AppKit is still initializing or processing
    status = 'initializing';
  } else if (wagmiIsReconnecting || appKitStatus === 'reconnecting') {
    // Reconnecting - check both wagmi and AppKit
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
