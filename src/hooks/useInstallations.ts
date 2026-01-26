'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Client } from '@xmtp/browser-sdk';
import type { Signer } from '@xmtp/browser-sdk';
import { useXmtpContext } from '@/providers/XmtpProvider';

/**
 * Installation info from XMTP inbox state
 */
interface Installation {
  id: string;
  bytes: Uint8Array;
}

interface UseInstallationsState {
  installations: Installation[];
  currentInstallationId: string | null;
  inboxId: string | null;
  isLoading: boolean;
  isRevoking: boolean;
  error: Error | null;
}

interface UseInstallationsReturn extends UseInstallationsState {
  /** Refresh the installations list from the network */
  refresh: () => Promise<void>;
  /** Revoke a specific installation by ID (requires signer for wallet signature) */
  revokeInstallation: (installationId: string, signer: Signer) => Promise<void>;
  /** Revoke all installations except the current one (requires signer for wallet signature) */
  revokeAllOther: (signer: Signer) => Promise<void>;
  /** Maximum allowed installations per inbox */
  maxInstallations: number;
}

const MAX_INSTALLATIONS = 10;

/**
 * Get XMTP environment from env var
 */
function getXmtpEnv(): 'local' | 'dev' | 'production' {
  const env = process.env.NEXT_PUBLIC_XMTP_ENV;
  if (env === 'production' || env === 'dev' || env === 'local') {
    return env;
  }
  return 'local';
}

/**
 * Hook to manage XMTP installations (connected devices/sessions)
 *
 * @returns Installation management methods and state
 */
export function useInstallations(): UseInstallationsReturn {
  const { client, isInitialized } = useXmtpContext();
  const [state, setState] = useState<UseInstallationsState>({
    installations: [],
    currentInstallationId: null,
    inboxId: null,
    isLoading: false,
    isRevoking: false,
    error: null,
  });

  // Keep a ref to current state to avoid stale closures in callbacks
  const stateRef = useRef(state);
  stateRef.current = state;

  // Ref to store refresh function for stable useEffect
  const refreshRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * Fetch installations from inbox state
   */
  const refresh = useCallback(async () => {
    if (!client) {
      setState(prev => ({
        ...prev,
        installations: [],
        currentInstallationId: null,
        error: new Error('XMTP client not initialized'),
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch latest inbox state from network for accurate installation list
      const inboxState = await client.preferences.fetchInboxState();

      // Get current installation ID from client (may be undefined, convert to null for consistency)
      const currentId = client.installationId ?? null;

      setState(prev => ({
        ...prev,
        installations: inboxState.installations.map(inst => ({
          id: inst.id,
          bytes: inst.bytes,
        })),
        currentInstallationId: currentId,
        inboxId: client.inboxId ?? null,
        isLoading: false,
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch installations');
      setState(prev => ({ ...prev, isLoading: false, error }));
      console.error('Failed to fetch installations:', err);
    }
  }, [client]);

  // Keep refresh ref updated for stable useEffect
  refreshRef.current = refresh;

  /**
   * Revoke a specific installation by ID
   * Requires a signer to authorize the revocation with a wallet signature
   */
  const revokeInstallation = useCallback(async (installationId: string, signer: Signer) => {
    // Access current state via ref to avoid stale closure
    const { inboxId, currentInstallationId, installations } = stateRef.current;

    if (!inboxId) {
      throw new Error('Inbox ID not available');
    }

    // Prevent revoking current installation
    if (installationId === currentInstallationId) {
      throw new Error('Cannot revoke current installation');
    }

    // Find the installation bytes for the given ID
    const installation = installations.find(inst => inst.id === installationId);
    if (!installation) {
      throw new Error('Installation not found');
    }

    setState(prev => ({ ...prev, isRevoking: true, error: null }));

    try {
      console.log('Revoking installation:', {
        id: installationId,
        bytesLength: installation.bytes.length,
        inboxId,
      });
      // Use static method with explicit signer to avoid probe signer issue
      await Client.revokeInstallations(
        signer,
        inboxId,
        [installation.bytes],
        getXmtpEnv()
      );
      // Refresh the list after revocation
      await refresh();
    } catch (err) {
      console.error('Revoke installation error details:', {
        error: err,
        installationId,
        bytesLength: installation.bytes.length,
      });
      const error = err instanceof Error ? err : new Error('Failed to revoke installation');
      setState(prev => ({ ...prev, isRevoking: false, error }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isRevoking: false }));
    }
  }, [refresh]);

  /**
   * Revoke all installations except current
   * Requires a signer to authorize the revocation with a wallet signature
   */
  const revokeAllOther = useCallback(async (signer: Signer) => {
    // Access current state via ref to avoid stale closure
    const { inboxId, currentInstallationId, installations } = stateRef.current;

    if (!inboxId) {
      throw new Error('Inbox ID not available');
    }

    // Get all installation bytes except current
    const otherInstallations = installations.filter(
      inst => inst.id !== currentInstallationId
    );

    if (otherInstallations.length === 0) {
      return; // Nothing to revoke
    }

    setState(prev => ({ ...prev, isRevoking: true, error: null }));

    try {
      console.log('Revoking all other installations:', {
        count: otherInstallations.length,
        inboxId,
      });
      // Use static method with explicit signer to avoid probe signer issue
      await Client.revokeInstallations(
        signer,
        inboxId,
        otherInstallations.map(inst => inst.bytes),
        getXmtpEnv()
      );
      // Refresh the list after revocation
      await refresh();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to revoke installations');
      setState(prev => ({ ...prev, isRevoking: false, error }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isRevoking: false }));
    }
  }, [refresh]);

  // Load installations on mount and when client becomes available
  useEffect(() => {
    if (client && isInitialized && refreshRef.current) {
      void refreshRef.current();
    }
  }, [client, isInitialized]);

  return {
    ...state,
    refresh,
    revokeInstallation,
    revokeAllOther,
    maxInstallations: MAX_INSTALLATIONS,
  };
}
