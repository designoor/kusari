'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useWalletClient } from 'wagmi';
import type { Client, EOASigner } from '@xmtp/browser-sdk';
import { createXmtpClient, createXmtpSigner } from '@/services/xmtp';
import type { XmtpContextValue } from '@/services/xmtp';
import { isOnboardingComplete } from '@/lib/onboarding/storage';
import { useWalletConnection } from '@/hooks/useWalletConnection';

const XmtpContext = createContext<XmtpContextValue | null>(null);

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
  const clientRef = useRef<Client | null>(null);

  // Wallet state for auto-initialization (AppKit as single source of truth)
  const { data: walletClient } = useWalletClient();
  const { address, isConnected, isLoading: walletLoading } = useWalletConnection();

  // Track previous wallet address to detect account switches
  const previousAddressRef = useRef<string | undefined>(undefined);

  const initialize = useCallback(async (signer: EOASigner) => {
    // Prevent multiple simultaneous initialization attempts
    if (isInitializing) {
      console.warn('XMTP initialization already in progress');
      return;
    }

    // If already initialized with a client, skip
    if (client && isInitialized) {
      console.log('XMTP client already initialized');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const xmtpClient = await createXmtpClient(signer);
      setClient(xmtpClient);
      setIsInitialized(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize XMTP client');
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
    }
  }, [client]);

  // Auto-initialize XMTP when returning after page refresh
  // This handles the case where onboarding is complete (localStorage) and wallet is connected,
  // but XMTP client was lost due to page refresh (React state reset)
  useEffect(() => {
    // Skip if already initialized or currently initializing
    if (isInitialized || isInitializing) return;

    // Skip if wallet is still loading (initializing, reconnecting, connecting)
    if (walletLoading) return;

    // Skip if wallet not ready
    if (!isConnected || !walletClient || !address) return;

    // Skip if onboarding not complete
    if (!isOnboardingComplete()) return;

    // Auto-initialize
    const signer = createXmtpSigner(walletClient, address);
    initialize(signer).catch((err) => {
      console.error('XMTP auto-initialization failed:', err);
    });
  }, [walletLoading, isConnected, walletClient, address, isInitialized, isInitializing, initialize]);

  // Detect wallet address changes and disconnect old client
  // This ensures we don't show stale data from a previous account
  useEffect(() => {
    // Skip on initial mount
    if (previousAddressRef.current === undefined) {
      previousAddressRef.current = address;
      return;
    }

    // Detect address change (including disconnect: address becomes undefined)
    if (previousAddressRef.current !== address) {
      disconnect();
    }

    previousAddressRef.current = address;
  }, [address, disconnect]);

  // Keep ref in sync with client state
  useEffect(() => {
    clientRef.current = client;
  }, [client]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        try {
          clientRef.current.close();
        } catch (err) {
          console.error('Error closing XMTP client on unmount:', err);
        }
        clientRef.current = null;
      }
    };
  }, []);

  const value: XmtpContextValue = {
    client,
    isInitialized,
    isInitializing,
    error,
    initialize,
    disconnect,
  };

  return <XmtpContext.Provider value={value}>{children}</XmtpContext.Provider>;
}
