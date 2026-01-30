'use client';

import React, { createContext, useContext, useMemo, useRef } from 'react';
import { useConversationData } from './ConversationDataProvider';
import { useEthosScores, generateAddressesKey } from '@/hooks/useEthosScore';
import type { ConversationPreview } from '@/types/conversation';
import type { EthosProfile } from '@/services/ethos';

/**
 * Context value for the conversation list provider
 */
interface ConversationListContextValue {
  /** Allowed conversation previews */
  previews: ConversationPreview[];
  /** Map of lowercase address to Ethos profile */
  ethosProfiles: Map<string, EthosProfile>;
  /** True while either XMTP or Ethos data is loading */
  isLoading: boolean;
  /** True only on initial load (no cached data yet) - use this for skeleton display */
  isInitialLoading: boolean;
  /** True when both XMTP and Ethos data have finished loading */
  isReady: boolean;
  /** Error from XMTP conversation loading */
  error: Error | null;
  /** Refresh conversations from XMTP (will trigger new Ethos fetch) */
  refresh: () => Promise<void>;
}

const ConversationListContext = createContext<ConversationListContextValue | null>(null);

/**
 * Hook to access conversation list data from the provider.
 * Must be used within a ConversationListProvider.
 *
 * @returns Conversation list data including previews, Ethos profiles, and loading states
 * @throws Error if used outside of ConversationListProvider
 */
export function useConversationList(): ConversationListContextValue {
  const context = useContext(ConversationListContext);
  if (!context) {
    throw new Error('useConversationList must be used within ConversationListProvider');
  }
  return context;
}

/**
 * Extract valid Ethereum addresses from conversation previews
 * Only extracts from DMs with valid 0x addresses
 */
function extractValidAddresses(previews: ConversationPreview[]): string[] {
  return previews.reduce<string[]>((acc, preview) => {
    if (preview.isDm) {
      const addr = preview.peerAddress ?? preview.peerInboxId;
      if (addr && /^0x[a-fA-F0-9]{40}$/i.test(addr)) {
        acc.push(addr);
      }
    }
    return acc;
  }, []);
}

/**
 * Provider that manages conversation list state at the layout level.
 *
 * This provider reads from the centralized ConversationDataProvider and adds:
 * - Ethos profile loading for DM addresses
 * - Initial loading state tracking for skeleton display
 *
 * Key features:
 * - Persists data across page navigations
 * - Coordinates XMTP + Ethos data loading
 * - Distinguishes between initial load (show skeleton) and refresh (show cached data)
 */
export function ConversationListProvider({ children }: { children: React.ReactNode }) {
  // Track if we've ever completed a full load cycle (persists across refreshes)
  const hasLoadedOnceRef = useRef(false);
  // Track if we've ever seen an actual loading state (not just the "no client" fallback)
  const hasSeenLoadingRef = useRef(false);
  // Track if we've ever had actual data (prevents empty state flash during refresh)
  const hasEverHadDataRef = useRef(false);

  // Get allowed conversations from centralized provider
  const data = useConversationData();

  // Track when a real load cycle starts
  if (data.isLoading) {
    hasSeenLoadingRef.current = true;
  }
  const previews = data.allowedPreviews;

  // Track if we've ever had data
  if (previews.length > 0) {
    hasEverHadDataRef.current = true;
  }

  // Only extract addresses when data has loaded
  const addressesForEthos = useMemo(() => {
    if (!data.hasAttemptedLoad || data.isLoading) {
      return [];
    }
    return extractValidAddresses(previews);
  }, [data.hasAttemptedLoad, data.isLoading, previews]);

  // Ethos data (only fetches when addresses become available)
  const { profiles: ethosProfiles, isLoading: isEthosLoading, completedKey } =
    useEthosScores(addressesForEthos);

  // Compute expected addresses key to verify Ethos has processed the exact addresses we expect
  const expectedAddressesKey = useMemo(
    () => generateAddressesKey(addressesForEthos),
    [addressesForEthos]
  );

  // Ethos is ready when it has processed the addresses we expect
  // This handles the timing gap where addresses change but Ethos hasn't started fetching yet
  const ethosReady = !isEthosLoading && completedKey === expectedAddressesKey;

  // Combined loading state
  const isLoading = data.isLoading || !ethosReady;
  const isReady = !isLoading;

  // Mark as loaded once all data is ready (XMTP finished + Ethos in sync)
  // Requires hasSeenLoadingRef to ensure a real load happened (not just "no client" fallback)
  const allDataReady =
    hasSeenLoadingRef.current && data.hasAttemptedLoad && !data.isLoading && ethosReady;
  if (allDataReady) {
    hasLoadedOnceRef.current = true;
  }

  // Parent provider (ConversationDataProvider) persists across navigation
  // If it has already loaded data, we should show it immediately (not skeleton)
  const hasCachedData = data.hasAttemptedLoad && !data.isLoading;
  // Show initial loading until we've completed a full cycle AND have data (or confirmed empty)
  // This prevents empty state from flashing during auto-refresh
  const isInitialLoading = !hasLoadedOnceRef.current && !hasCachedData && !hasEverHadDataRef.current;

  const value = useMemo(
    () => ({
      previews,
      ethosProfiles,
      isLoading,
      isInitialLoading,
      isReady,
      error: data.error,
      refresh: data.refresh,
    }),
    [previews, ethosProfiles, isLoading, isInitialLoading, isReady, data.error, data.refresh]
  );

  return (
    <ConversationListContext.Provider value={value}>
      {children}
    </ConversationListContext.Provider>
  );
}
