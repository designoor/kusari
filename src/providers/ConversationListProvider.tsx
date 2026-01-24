'use client';

import React, { createContext, useContext, useMemo, useRef } from 'react';
import { ConsentState } from '@xmtp/browser-sdk';
import { useConversations } from '@/hooks/useConversations';
import { useEthosScores } from '@/hooks/useEthosScore';
import type { ConversationPreview } from '@/types/conversation';
import type { EthosProfile } from '@/services/ethos';

/**
 * Context value for the conversation list provider
 */
interface ConversationListContextValue {
  /** Filtered conversation previews from XMTP */
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
 * This provider ensures conversation list data persists across page navigations
 * within the chat section, preventing unnecessary skeleton flashing when moving
 * between conversations.
 *
 * Key features:
 * - Persists data across page navigations
 * - Coordinates XMTP + Ethos data loading
 * - Distinguishes between initial load (show skeleton) and refresh (show cached data)
 */
export function ConversationListProvider({ children }: { children: React.ReactNode }) {
  // Track if we've ever completed a full load cycle (persists across refreshes)
  const hasLoadedOnceRef = useRef(false);

  // Phase 1: XMTP data (allowed conversations only)
  const xmtp = useConversations({ consentState: ConsentState.Allowed });

  // Only extract addresses when XMTP has attempted load AND is not currently loading
  // This ensures Ethos fetch only starts after XMTP is complete
  const addressesForEthos = useMemo(() => {
    if (!xmtp.hasAttemptedLoad || xmtp.isLoading) {
      return []; // Don't trigger Ethos fetch yet
    }
    return extractValidAddresses(xmtp.filteredPreviews);
  }, [xmtp.hasAttemptedLoad, xmtp.isLoading, xmtp.filteredPreviews]);

  // Phase 2: Ethos data (only fetches when addresses become available)
  const { profiles: ethosProfiles, isLoading: isEthosLoading } = useEthosScores(addressesForEthos);

  // Combined loading state
  const isLoading = xmtp.isLoading || isEthosLoading;
  const isReady = !isLoading;

  // Mark as loaded once:
  // 1. XMTP has attempted load (first load completed or determined nothing to load)
  // 2. XMTP is not currently loading
  // 3. Ethos is not currently loading
  const allDataReady = xmtp.hasAttemptedLoad && !xmtp.isLoading && !isEthosLoading;
  if (allDataReady) {
    hasLoadedOnceRef.current = true;
  }

  // Show skeleton until first complete load cycle finishes
  // After first load, show cached data during refreshes (no skeleton flash)
  const isInitialLoading = !hasLoadedOnceRef.current;

  const value = useMemo(
    () => ({
      previews: xmtp.filteredPreviews,
      ethosProfiles,
      isLoading,
      isInitialLoading,
      isReady,
      error: xmtp.error,
      refresh: xmtp.refresh,
    }),
    [xmtp.filteredPreviews, ethosProfiles, isLoading, isInitialLoading, isReady, xmtp.error, xmtp.refresh]
  );

  return (
    <ConversationListContext.Provider value={value}>
      {children}
    </ConversationListContext.Provider>
  );
}
