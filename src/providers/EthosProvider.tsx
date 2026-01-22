'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { ConsentState } from '@xmtp/browser-sdk';
import { useConversations } from '@/hooks/useConversations';
import { fetchEthosProfiles } from '@/services/ethos';
import type { EthosProfile } from '@/services/ethos';

/** Refresh interval for Ethos profiles (10 minutes) */
const REFRESH_INTERVAL = 10 * 60 * 1000;

interface EthosContextValue {
  /** Map of lowercase address to EthosProfile */
  profiles: Map<string, EthosProfile>;
  /** Whether the initial fetch is in progress */
  isLoading: boolean;
  /** Get profile by address (case-insensitive) */
  getProfile: (address: string) => EthosProfile | undefined;
  /** Check if profile exists in context */
  hasProfile: (address: string) => boolean;
  /** Manually trigger a refresh of all profiles */
  refresh: () => Promise<void>;
}

const EthosContext = createContext<EthosContextValue | null>(null);

/**
 * Hook to access global Ethos profile context.
 * Must be used within EthosProvider.
 */
export function useEthosContext(): EthosContextValue {
  const context = useContext(EthosContext);
  if (!context) {
    throw new Error('useEthosContext must be used within EthosProvider');
  }
  return context;
}

/**
 * Hook to safely access Ethos context (returns null if outside provider).
 * Useful for components that may be used both inside and outside the provider.
 */
export function useEthosContextSafe(): EthosContextValue | null {
  return useContext(EthosContext);
}

interface EthosProviderProps {
  children: React.ReactNode;
}

/**
 * Global provider for Ethos profile data.
 *
 * Features:
 * - Fetches profiles for allowed contacts only (not requests/denied)
 * - Caches profiles in React state for instant access
 * - Auto-refreshes every 10 minutes
 * - Automatically updates when allowed contacts change (handles additions and removals)
 */
export function EthosProvider({ children }: EthosProviderProps) {
  const [profiles, setProfiles] = useState<Map<string, EthosProfile>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Get all conversation previews
  const { previews, isLoading: conversationsLoading } = useConversations();

  // Extract addresses for allowed DM contacts only
  const allowedAddresses = useMemo(() => {
    return previews
      .filter((p) => p.consentState === ConsentState.Allowed && p.isDm)
      .map((p) => p.peerAddress ?? p.peerInboxId)
      .filter((addr): addr is string => !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr));
  }, [previews]);

  // Create stable key for dependency tracking
  const addressesKey = useMemo(
    () => allowedAddresses.map((a) => a.toLowerCase()).sort().join(','),
    [allowedAddresses]
  );

  // Track previous key to detect changes
  const prevAddressesKeyRef = useRef<string>('');

  /**
   * Fetch profiles for all allowed addresses
   */
  const fetchAllowedProfiles = useCallback(
    async (signal?: AbortSignal) => {
      if (allowedAddresses.length === 0) {
        setProfiles(new Map());
        return;
      }

      setIsLoading(true);
      try {
        const fetchedProfiles = await fetchEthosProfiles(allowedAddresses, signal);
        // Only update state if not aborted
        if (!signal?.aborted) {
          setProfiles(fetchedProfiles);
        }
      } catch (error) {
        // Ignore abort errors, log others
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Failed to fetch Ethos profiles:', error);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [allowedAddresses]
  );

  // Initial fetch and re-fetch when allowed addresses change
  useEffect(() => {
    // Don't fetch while conversations are still loading
    if (conversationsLoading) {
      return;
    }

    // Only re-fetch if addresses actually changed
    if (prevAddressesKeyRef.current === addressesKey) {
      return;
    }

    prevAddressesKeyRef.current = addressesKey;

    const abortController = new AbortController();
    void fetchAllowedProfiles(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [addressesKey, conversationsLoading, fetchAllowedProfiles]);

  // Periodic refresh every 10 minutes
  useEffect(() => {
    if (allowedAddresses.length === 0) {
      return;
    }

    let abortController: AbortController | null = null;

    const intervalId = setInterval(() => {
      // Abort previous refresh if still in progress
      abortController?.abort();
      abortController = new AbortController();
      void fetchAllowedProfiles(abortController.signal);
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(intervalId);
      abortController?.abort();
    };
  }, [addressesKey, allowedAddresses.length, fetchAllowedProfiles]);

  // Context API functions
  const getProfile = useCallback(
    (address: string): EthosProfile | undefined => {
      return profiles.get(address.toLowerCase());
    },
    [profiles]
  );

  const hasProfile = useCallback(
    (address: string): boolean => {
      return profiles.has(address.toLowerCase());
    },
    [profiles]
  );

  const refresh = useCallback(async () => {
    await fetchAllowedProfiles();
  }, [fetchAllowedProfiles]);

  const value = useMemo(
    (): EthosContextValue => ({
      profiles,
      isLoading,
      getProfile,
      hasProfile,
      refresh,
    }),
    [profiles, isLoading, getProfile, hasProfile, refresh]
  );

  return <EthosContext.Provider value={value}>{children}</EthosContext.Provider>;
}
