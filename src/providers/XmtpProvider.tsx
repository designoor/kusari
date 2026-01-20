'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Client, EOASigner } from '@xmtp/browser-sdk';
import { createXmtpClient } from '@/services/xmtp';
import type { XmtpContextValue } from '@/services/xmtp';

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
      // Cleanup client resources if needed
      setClient(null);
      setIsInitialized(false);
      setError(null);
    }
  }, [client]);

  // Keep ref in sync with client state
  useEffect(() => {
    clientRef.current = client;
  }, [client]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        // Perform any necessary cleanup
        // Reset state without triggering re-renders during unmount
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
