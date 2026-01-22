'use client';

import { useMemo } from 'react';
import { ConsentState } from '@xmtp/browser-sdk';
import { useConversations } from './useConversations';
import { useEthosScores } from './useEthosScore';
import type { ConversationPreview, ConversationFilter } from '@/types/conversation';
import type { EthosProfile } from '@/services/ethos';

/**
 * Return type for the coordinated conversations hook
 */
export interface CoordinatedConversationsReturn {
  /** Filtered conversation previews from XMTP */
  previews: ConversationPreview[];
  /** Map of lowercase address to Ethos profile */
  ethosProfiles: Map<string, EthosProfile>;
  /** True while either XMTP or Ethos data is loading */
  isLoading: boolean;
  /** True when both XMTP and Ethos data have finished loading */
  isReady: boolean;
  /** Error from XMTP conversation loading */
  error: Error | null;
  /** Refresh conversations from XMTP (will trigger new Ethos fetch) */
  refresh: () => Promise<void>;
}

/**
 * Extract valid Ethereum addresses from conversation previews
 * Only extracts from DMs with valid 0x addresses
 */
function extractValidAddresses(previews: ConversationPreview[]): string[] {
  return previews
    .filter((preview) => preview.isDm)
    .map((preview) => preview.peerAddress ?? preview.peerInboxId)
    .filter((addr): addr is string => !!addr && /^0x[a-fA-F0-9]{40}$/i.test(addr));
}

/**
 * Hook that coordinates XMTP conversation loading with Ethos profile fetching.
 *
 * This hook ensures sequential loading:
 * 1. First, XMTP conversations are fully loaded
 * 2. Then, Ethos profiles are batch-fetched for all DM addresses
 *
 * This prevents race conditions and minimizes re-renders by:
 * - Only starting Ethos fetch after XMTP is complete
 * - Providing a single `isLoading` state that represents "all data ready"
 * - Returning both data sources together for coordinated rendering
 *
 * @param filter Optional filter to apply to conversations
 * @returns Coordinated data including previews, Ethos profiles, and loading states
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   const { previews, ethosProfiles, isLoading, error } = useCoordinatedAllowedConversations();
 *
 *   if (isLoading) return <ConversationListSkeleton />;
 *   if (error) return <ErrorState error={error} />;
 *
 *   return (
 *     <ConversationList
 *       conversations={previews}
 *       ethosProfiles={ethosProfiles}
 *     />
 *   );
 * }
 * ```
 */
export function useCoordinatedConversations(
  filter?: ConversationFilter
): CoordinatedConversationsReturn {
  // Phase 1: XMTP data
  const xmtp = useConversations(filter);

  // Only extract addresses when XMTP is NOT loading
  // This ensures Ethos fetch only starts after XMTP is complete
  const addressesForEthos = useMemo(() => {
    if (xmtp.isLoading) {
      return []; // Don't trigger Ethos fetch yet
    }
    return extractValidAddresses(xmtp.filteredPreviews);
  }, [xmtp.isLoading, xmtp.filteredPreviews]);

  // Phase 2: Ethos data (only fetches when addresses become available)
  // useEthosScores now properly tracks loading state including the render gap
  const { profiles: ethosProfiles, isLoading: isEthosLoading } = useEthosScores(addressesForEthos);

  // Combined loading state:
  // - Loading if XMTP is loading
  // - Loading if Ethos is loading (includes addresses changed but not yet fetched)
  const isLoading = xmtp.isLoading || isEthosLoading;

  // Ready when both phases complete
  const isReady = !xmtp.isLoading && !isEthosLoading;

  return {
    previews: xmtp.filteredPreviews,
    ethosProfiles,
    isLoading,
    isReady,
    error: xmtp.error,
    refresh: xmtp.refresh,
  };
}

/**
 * Hook for allowed conversations (main chat view) with coordinated Ethos loading
 */
export function useCoordinatedAllowedConversations(): CoordinatedConversationsReturn {
  return useCoordinatedConversations({ consentState: ConsentState.Allowed });
}

/**
 * Hook for message requests (unknown consent) with coordinated Ethos loading
 */
export function useCoordinatedMessageRequests(): CoordinatedConversationsReturn {
  return useCoordinatedConversations({ consentState: ConsentState.Unknown });
}

/**
 * Hook for denied contacts with coordinated Ethos loading
 */
export function useCoordinatedDeniedContacts(): CoordinatedConversationsReturn {
  return useCoordinatedConversations({ consentState: ConsentState.Denied });
}
