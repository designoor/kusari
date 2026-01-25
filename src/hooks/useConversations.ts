'use client';

import { useMemo } from 'react';
import { useConversationData } from '@/providers/ConversationDataProvider';
import type { Conversation, ConversationPreview, ConversationFilter } from '@/types/conversation';

interface UseConversationsReturn {
  /** All conversations */
  conversations: Conversation[];
  /** All previews (unfiltered) */
  previews: ConversationPreview[];
  /** Filtered previews based on filter options */
  filteredPreviews: ConversationPreview[];
  /** True while loading */
  isLoading: boolean;
  /** True after first load attempt */
  hasAttemptedLoad: boolean;
  /** Error if any */
  error: Error | null;
  /** Refresh conversations */
  refresh: () => Promise<void>;
  /** Get a specific conversation by ID */
  getConversation: (id: string) => Promise<Conversation | null>;
}

/**
 * Hook to access XMTP conversations.
 *
 * This hook reads from the centralized ConversationDataProvider,
 * ensuring all components share the same data and stream subscriptions.
 *
 * @param filter Optional filter to apply to conversation list
 * @returns Conversation state and helper methods
 */
export function useConversations(filter?: ConversationFilter): UseConversationsReturn {
  const data = useConversationData();

  // Convert Map to array for backwards compatibility
  const conversations = useMemo(
    () => Array.from(data.conversations.values()),
    [data.conversations]
  );

  // All previews (unfiltered, for backwards compatibility)
  const previews = data.allPreviews;

  // Apply filters to previews
  const filteredPreviews = useMemo(() => {
    if (!filter) {
      return data.allPreviews;
    }

    return data.allPreviews.filter((preview) => {
      // Filter by consent state
      if (filter.consentState !== undefined) {
        if (preview.consentState !== filter.consentState) {
          return false;
        }
      }

      // Filter by conversation type
      if (filter.conversationType !== undefined) {
        if (filter.conversationType === 'dm' && !preview.isDm) {
          return false;
        }
        if (filter.conversationType === 'group' && preview.isDm) {
          return false;
        }
      }

      // Filter by has messages
      if (filter.hasMessages !== undefined) {
        if (filter.hasMessages && !preview.lastMessage) {
          return false;
        }
        if (!filter.hasMessages && preview.lastMessage) {
          return false;
        }
      }

      // Filter by search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const matchesAddress = preview.peerAddress?.toLowerCase().includes(query);
        const matchesInboxId = preview.peerInboxId?.toLowerCase().includes(query);
        const matchesGroupName = preview.groupName?.toLowerCase().includes(query);
        const matchesContent = preview.lastMessage?.content.toLowerCase().includes(query);

        if (!matchesAddress && !matchesInboxId && !matchesGroupName && !matchesContent) {
          return false;
        }
      }

      return true;
    });
  }, [data.allPreviews, filter]);

  return {
    conversations,
    previews,
    filteredPreviews,
    isLoading: data.isLoading,
    hasAttemptedLoad: data.hasAttemptedLoad,
    error: data.error,
    refresh: data.refresh,
    getConversation: data.getConversation,
  };
}

/**
 * Helper hook that builds a UseConversationsReturn from the data provider
 * with a specific set of filtered previews.
 */
function useConversationsWithFilter(
  getFilteredPreviews: (data: ReturnType<typeof useConversationData>) => ConversationPreview[]
): UseConversationsReturn {
  const data = useConversationData();

  const conversations = useMemo(
    () => Array.from(data.conversations.values()),
    [data.conversations]
  );

  const filteredPreviews = getFilteredPreviews(data);

  return {
    conversations,
    previews: data.allPreviews,
    filteredPreviews,
    isLoading: data.isLoading,
    hasAttemptedLoad: data.hasAttemptedLoad,
    error: data.error,
    refresh: data.refresh,
    getConversation: data.getConversation,
  };
}

/**
 * Hook to get only allowed conversations (for main chat view)
 */
export function useAllowedConversations(): UseConversationsReturn {
  return useConversationsWithFilter((data) => data.allowedPreviews);
}

/**
 * Hook to get unknown/pending conversations (for message requests)
 */
export function useMessageRequests(): UseConversationsReturn {
  return useConversationsWithFilter((data) => data.requestPreviews);
}

/**
 * Hook to get denied conversations
 */
export function useDeniedConversations(): UseConversationsReturn {
  return useConversationsWithFilter((data) => data.deniedPreviews);
}
