'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLatest } from './useLatest';
import type { Consent } from '@xmtp/browser-sdk';
import { ConsentState } from '@xmtp/browser-sdk';
import { useXmtpContext } from '@/providers/XmtpProvider';
import {
  allowInboxes,
  denyInboxes,
  setInboxConsent,
  getInboxConsentState,
  streamConsent,
  syncPreferences,
} from '@/services/xmtp/consent';
import type { ConsentUpdate } from '@/types/consent';

interface UseConsentState {
  isLoading: boolean;
  error: Error | null;
}

interface UseConsentReturn extends UseConsentState {
  allowContact: (inboxId: string) => Promise<void>;
  denyContact: (inboxId: string) => Promise<void>;
  resetContact: (inboxId: string) => Promise<void>;
  getConsentState: (inboxId: string) => Promise<ConsentState>;
  allowContacts: (inboxIds: string[]) => Promise<void>;
  denyContacts: (inboxIds: string[]) => Promise<void>;
}

/**
 * Hook to manage consent state for contacts
 * Provides methods to allow/deny contacts and check consent state
 *
 * @returns Consent management methods and state
 */
export function useConsent(): UseConsentReturn {
  const { client, isInitialized } = useXmtpContext();
  const [state, setState] = useState<UseConsentState>({
    isLoading: false,
    error: null,
  });

  /**
   * Allow a single contact
   */
  const allowContact = useCallback(
    async (inboxId: string) => {
      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await allowInboxes(client, [inboxId]);
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to allow contact');
        setState((prev) => ({ ...prev, isLoading: false, error }));
        throw error;
      }
    },
    [client]
  );

  /**
   * Deny (block) a single contact
   */
  const denyContact = useCallback(
    async (inboxId: string) => {
      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await denyInboxes(client, [inboxId]);
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to deny contact');
        setState((prev) => ({ ...prev, isLoading: false, error }));
        throw error;
      }
    },
    [client]
  );

  /**
   * Reset a single contact to unknown state (move to requests)
   */
  const resetContact = useCallback(
    async (inboxId: string) => {
      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await setInboxConsent(client, [inboxId], ConsentState.Unknown);
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to reset contact');
        setState((prev) => ({ ...prev, isLoading: false, error }));
        throw error;
      }
    },
    [client]
  );

  /**
   * Allow multiple contacts
   */
  const allowContacts = useCallback(
    async (inboxIds: string[]) => {
      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      if (inboxIds.length === 0) {
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await allowInboxes(client, inboxIds);
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to allow contacts');
        setState((prev) => ({ ...prev, isLoading: false, error }));
        throw error;
      }
    },
    [client]
  );

  /**
   * Deny multiple contacts
   */
  const denyContacts = useCallback(
    async (inboxIds: string[]) => {
      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      if (inboxIds.length === 0) {
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await denyInboxes(client, inboxIds);
        setState((prev) => ({ ...prev, isLoading: false }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to deny contacts');
        setState((prev) => ({ ...prev, isLoading: false, error }));
        throw error;
      }
    },
    [client]
  );

  /**
   * Get consent state for a specific inbox
   */
  const getConsentState = useCallback(
    async (inboxId: string): Promise<ConsentState> => {
      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      return getInboxConsentState(client, inboxId);
    },
    [client]
  );

  // Sync preferences on mount
  useEffect(() => {
    if (!client || !isInitialized) {
      return;
    }

    void syncPreferences(client).catch((err) => {
      console.error('Failed to sync preferences:', err);
    });
  }, [client, isInitialized]);

  return {
    ...state,
    allowContact,
    denyContact,
    resetContact,
    getConsentState,
    allowContacts,
    denyContacts,
  };
}

/**
 * Hook to stream consent updates and maintain a cache of consent states
 * Useful for components that need to react to consent changes
 *
 * @param onUpdate Optional callback for consent updates
 * @returns Consent state cache and methods
 */
export function useConsentStream(onUpdate?: (updates: ConsentUpdate[]) => void) {
  const { client, isInitialized } = useXmtpContext();
  const [consentCache, setConsentCache] = useState<Map<string, ConsentState>>(new Map());

  // Store callback in ref to avoid recreating stream when callback changes
  const onUpdateRef = useLatest(onUpdate);

  // Stream consent updates
  // Clear cache when client becomes unavailable to prevent stale data
  useEffect(() => {
    if (!client || !isInitialized) {
      // Clear consent cache when client is gone (e.g., wallet disconnected)
      setConsentCache(new Map());
      return;
    }

    const cleanup = streamConsent(client, (updates: Consent[]) => {
      // Convert to ConsentUpdate format and update cache
      const consentUpdates: ConsentUpdate[] = updates.map((update) => ({
        inboxId: update.entity,
        state: update.state,
        timestamp: new Date(),
      }));

      // Update cache
      setConsentCache((prev) => {
        const newCache = new Map(prev);
        for (const update of consentUpdates) {
          newCache.set(update.inboxId, update.state);
        }
        return newCache;
      });

      // Call optional callback using ref to get latest version
      onUpdateRef.current?.(consentUpdates);
    });

    return cleanup;
  }, [client, isInitialized]);

  /**
   * Get cached consent state for an inbox
   */
  const getCachedConsentState = useCallback(
    (inboxId: string): ConsentState | undefined => {
      return consentCache.get(inboxId);
    },
    [consentCache]
  );

  return {
    consentCache,
    getCachedConsentState,
  };
}

/**
 * Hook to get consent state for a specific inbox with caching
 *
 * @param inboxId The inbox ID to check consent for
 * @returns Consent state and loading state
 */
export function useInboxConsent(inboxId: string | null) {
  const { client, isInitialized } = useXmtpContext();
  const [consentState, setConsentState] = useState<ConsentState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const consent = useConsent();

  // Load consent state
  useEffect(() => {
    if (!client || !isInitialized || !inboxId) {
      setConsentState(null);
      return;
    }

    const loadConsent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const state = await getInboxConsentState(client, inboxId);
        setConsentState(state);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to get consent state');
        setError(error);
        setConsentState(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadConsent();
  }, [client, isInitialized, inboxId]);

  /**
   * Allow this contact
   */
  const allow = useCallback(async () => {
    if (!inboxId) return;
    await consent.allowContact(inboxId);
    setConsentState(ConsentState.Allowed);
  }, [inboxId, consent]);

  /**
   * Deny this contact
   */
  const deny = useCallback(async () => {
    if (!inboxId) return;
    await consent.denyContact(inboxId);
    setConsentState(ConsentState.Denied);
  }, [inboxId, consent]);

  return {
    consentState,
    isLoading,
    error,
    allow,
    deny,
    isAllowed: consentState === ConsentState.Allowed,
    isDenied: consentState === ConsentState.Denied,
    isUnknown: consentState === ConsentState.Unknown,
  };
}
