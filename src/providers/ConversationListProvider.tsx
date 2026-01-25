'use client';

import React, { createContext, useContext, useMemo, useRef } from 'react';
import { useConversationData } from './ConversationDataProvider';
import { useEthosScores } from '@/hooks/useEthosScore';
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

  // Get allowed conversations from centralized provider
  const data = useConversationData();
  const previews = data.allowedPreviews;

  // Only extract addresses when data has loaded
  const addressesForEthos = useMemo(() => {
    if (!data.hasAttemptedLoad || data.isLoading) {
      return [];
    }
    return extractValidAddresses(previews);
  }, [data.hasAttemptedLoad, data.isLoading, previews]);

  // Ethos data (only fetches when addresses become available)
  const { profiles: ethosProfiles, isLoading: isEthosLoading } = useEthosScores(addressesForEthos);

  // Combined loading state
  const isLoading = data.isLoading || isEthosLoading;
  const isReady = !isLoading;

  // Mark as loaded once all data is ready
  const allDataReady = data.hasAttemptedLoad && !data.isLoading && !isEthosLoading;
  if (allDataReady) {
    hasLoadedOnceRef.current = true;
  }

  // Show skeleton until first complete load cycle finishes
  const isInitialLoading = !hasLoadedOnceRef.current;

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
