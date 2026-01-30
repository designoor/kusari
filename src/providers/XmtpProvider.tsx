'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useWalletClient } from 'wagmi';
import type { Client, EOASigner } from '@xmtp/browser-sdk';
import { createXmtpClient, clearXmtpSession } from '@/services/xmtp';
import type { XmtpContextValue } from '@/services/xmtp';
import { useWalletConnection } from '@/hooks/useWalletConnection';

const XmtpContext = createContext<XmtpContextValue | null>(null);

// Error patterns for installation limit detection
const INSTALLATION_LIMIT_PATTERNS = [
  'too many installations',
  'installation limit',
  'max installations',
  'exceeded installation',
];

/**
 * Check if an error is related to the XMTP installation limit (10 per inbox)
 */
function isInstallationLimitError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return INSTALLATION_LIMIT_PATTERNS.some(pattern => message.includes(pattern));
}

/**
 * Custom error class for installation limit errors
 * Provides better user-facing messaging
 */
export class InstallationLimitError extends Error {
  constructor(originalError?: Error) {
    super(
      'You have reached the maximum number of active sessions (10). ' +
      'Please go to Settings > Active Sessions to revoke old sessions.'
    );
    this.name = 'InstallationLimitError';
    this.cause = originalError;
  }
}

/**
 * Sync conversations and preferences from the XMTP network.
 * Ensures fresh data after client initialization.
 * Failures are logged but don't block initialization.
 */
async function syncClientData(xmtpClient: Client): Promise<void> {
  try {
    // Sync preferences first to get fresh consent state from network
    await xmtpClient.preferences.sync();
    // Then sync all conversations (Allowed + Unknown by default)
    await xmtpClient.conversations.syncAll();
  } catch (syncError) {
    console.warn('Network sync failed, continuing with local data:', syncError);
  }
}

export function useXmtpContext() {
  const context = useContext(XmtpContext);
  if (!context) {
    throw new Error('useXmtpContext must be used within XmtpProvider');
  }
  return context;
}

interface XmtpProviderProps {
  children: React.ReactNode;
}

export function XmtpProvider({ children }: XmtpProviderProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasAttemptedAutoInit, setHasAttemptedAutoInit] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // Prevent concurrent identity probes
  const isProbing = useRef(false);

  // Wallet state for auto-initialization and detecting address changes
  const { data: walletClient } = useWalletClient();
  const { address, isConnected, isLoading: walletLoading } = useWalletConnection();

  // Track previous wallet address to detect account switches
  const previousAddressRef = useRef<string | undefined>(undefined);

  const initialize = useCallback(async (signer: EOASigner) => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing) {
      return;
    }

    // If already initialized with a client, skip
    if (client && isInitialized) {
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const xmtpClient = await createXmtpClient(signer);
      await syncClientData(xmtpClient);
      setClient(xmtpClient);
      setIsInitialized(true);
    } catch (err) {
      let error: Error;
      if (err instanceof Error) {
        // Check for installation limit error and wrap with user-friendly message
        error = isInstallationLimitError(err) ? new InstallationLimitError(err) : err;
      } else {
        error = new Error('Failed to initialize XMTP client');
      }
      setError(error);
      console.error('XMTP initialization error:', error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [client, isInitialized, isInitializing]);

  const disconnect = useCallback(() => {
    if (client) {
      try {
        // Terminate web worker and clean up resources
        client.close();
      } catch (err) {
        console.error('Error closing XMTP client:', err);
      }
      setClient(null);
      setIsInitialized(false);
      setError(null);
      // Clear stored session when disconnecting
      clearXmtpSession();
    }
  }, [client]);

  // Probe-based identity check: After wallet connects, check if XMTP identity exists.
  // - If identity exists: create client silently (no signature needed) → /chat
  // - If no identity: show Sign step → user clicks Enable → signature prompt → /chat
  //
  // This approach doesn't differentiate "new vs returning" users by session state.
  // Instead, it checks whether XMTP identity exists for the connected address.
  useEffect(() => {
    // Skip if already initialized or currently initializing
    if (isInitialized || isInitializing) return;

    // Skip if already attempted
    if (hasAttemptedAutoInit) return;

    // Skip if wallet is still loading (initializing, reconnecting, connecting)
    if (walletLoading) return;

    // Skip if wallet not connected - no need to set hasAttemptedAutoInit here
    // because useAppState's loading logic doesn't depend on it when disconnected.
    // The address change effect will reset hasAttemptedAutoInit when wallet reconnects.
    if (!isConnected) return;

    // Wait for wallet data to be fully available before probing
    // Don't mark as attempted - we're still waiting for data
    if (!walletClient || !address) {
      return;
    }

    // Prevent concurrent probes
    if (isProbing.current) return;
    isProbing.current = true;

    // Check if XMTP identity exists and restore client session.
    // We use Client.build() which only loads from local OPFS database without network registration.
    // This avoids the probe signer issue where Client.create() opens OPFS but then fails
    // to close it when the signature is rejected, leaving the handle locked.
    const checkIdentity = async () => {
      try {
        // Import buildXmtpClient dynamically to avoid circular deps
        const { buildXmtpClient } = await import('@/services/xmtp/client');
        const existingClient = await buildXmtpClient(address);

        if (existingClient) {
          // Success! Client was restored from OPFS without needing a signature.
          await syncClientData(existingClient);
          setClient(existingClient);
          setIsInitialized(true);
        }
        // If no client returned, user needs to sign - this is expected for new users
      } catch (err) {
        // Real error during client restoration
        let error: Error;
        if (err instanceof Error) {
          error = isInstallationLimitError(err) ? new InstallationLimitError(err) : err;
        } else {
          error = new Error('Identity check failed');
        }
        setError(error);
        console.error('XMTP identity check failed:', error);
      } finally {
        setHasAttemptedAutoInit(true);
        isProbing.current = false;
      }
    };

    checkIdentity();
  }, [walletLoading, isConnected, walletClient, address, isInitialized, isInitializing, hasAttemptedAutoInit]);

  // Detect wallet address changes and handle reconnection
  // This ensures we don't show stale data from a previous account
  // and properly handles the reconnection case during page refresh
  useEffect(() => {
    const previousAddress = previousAddressRef.current;

    // Case 1: Initial mount with no address yet - just record
    if (previousAddress === undefined && address === undefined) {
      previousAddressRef.current = address;
      return;
    }

    // Case 2: Wallet reconnected (undefined -> valid address)
    // Reset hasAttemptedAutoInit to allow identity check to run.
    // This handles the race condition where wallet appears disconnected briefly
    // before reconnecting during page refresh.
    if (previousAddress === undefined && address !== undefined) {
      previousAddressRef.current = address;
      setHasAttemptedAutoInit(false);
      return;
    }

    // Case 3: Address actually changed (account switch or wallet disconnect)
    if (previousAddress !== address) {
      disconnect();
      setHasAttemptedAutoInit(false);
    }

    previousAddressRef.current = address;
  }, [address, disconnect]);

  // Keep ref in sync with client state
  useEffect(() => {
    clientRef.current = client;
  }, [client]);

  // Cleanup on unmount and before page unload
  // This is critical for XMTP's OPFS storage - if the connection isn't closed,
  // the OPFS file handle remains locked and can't be reopened after refresh
  useEffect(() => {
    const cleanup = () => {
      if (clientRef.current) {
        try {
          clientRef.current.close();
        } catch {
          // Ignore close errors during cleanup
        }
        clientRef.current = null;
      }
    };

    // Handle page refresh/close - critical for releasing OPFS handles
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('pagehide', cleanup);

    return () => {
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('pagehide', cleanup);
      cleanup();
    };
  }, []);

  const value: XmtpContextValue = {
    client,
    isInitialized,
    isInitializing,
    error,
    hasAttemptedAutoInit,
    initialize,
    disconnect,
  };

  return <XmtpContext.Provider value={value}>{children}</XmtpContext.Provider>;
}
