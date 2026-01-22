'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ConsentState } from '@xmtp/browser-sdk';
import { useXmtpContext } from '@/providers/XmtpProvider';
import { usePreferencesContextSafe } from '@/providers/PreferencesProvider';
import {
  listConversations,
  streamConversations,
  syncConversations,
  getConversationById,
} from '@/services/xmtp/conversations';
import { getLatestMessage, syncConversation } from '@/services/xmtp/messages';
import { getInboxConsentState, getInboxConsentStates } from '@/services/xmtp/consent';
import { getAddressForInboxId, getAddressesForInboxIds } from '@/services/xmtp/identity';
import { useConsentStream } from './useConsent';
import type { ConsentUpdate } from '@/types/consent';
import type { Conversation, Dm, ConversationPreview, ConversationFilter } from '@/types/conversation';

/**
 * Type guard to check if a conversation is a DM
 * DMs have a peerInboxId method while Groups don't
 */
function isDm(conversation: Conversation): conversation is Dm {
  return 'peerInboxId' in conversation && typeof conversation.peerInboxId === 'function';
}

interface UseConversationsState {
  conversations: Conversation[];
  previews: ConversationPreview[];
  isLoading: boolean;
  error: Error | null;
}

interface UseConversationsReturn extends UseConversationsState {
  refresh: () => Promise<void>;
  getConversation: (id: string) => Promise<Conversation | null>;
  filteredPreviews: ConversationPreview[];
}

/**
 * Hook to manage XMTP conversations
 * Provides conversation list, previews, streaming updates, and filtering
 *
 * Optimizations:
 * - Batch address resolution (1 API call instead of N)
 * - Batch consent state fetching (parallel)
 * - Skip conversation sync when hideMessagePreviews is enabled
 *
 * @param filter Optional filter to apply to conversation list
 * @returns Conversation state and helper methods
 */
export function useConversations(filter?: ConversationFilter): UseConversationsReturn {
  const { client, isInitialized } = useXmtpContext();
  const preferences = usePreferencesContextSafe();
  const hideMessagePreviews = preferences?.hideMessagePreviews ?? false;

  const [state, setState] = useState<UseConversationsState>({
    conversations: [],
    previews: [],
    isLoading: false,
    error: null,
  });

  // Handle consent updates from centralized consent stream
  const handleConsentUpdate = useCallback((updates: ConsentUpdate[]) => {
    setState((prev) => {
      let hasChanges = false;
      const updatedPreviews = prev.previews.map((preview) => {
        // Find if there's a consent update for this preview's peer inbox
        const consentUpdate = updates.find(
          (update) => update.inboxId === preview.peerInboxId
        );

        if (consentUpdate && consentUpdate.state !== preview.consentState) {
          hasChanges = true;
          return { ...preview, consentState: consentUpdate.state };
        }

        return preview;
      });

      // Only update state if there were actual changes
      if (hasChanges) {
        return { ...prev, previews: updatedPreviews };
      }

      return prev;
    });
  }, []);

  // Subscribe to consent stream for real-time updates
  useConsentStream(handleConsentUpdate);

  /**
   * Build previews for multiple conversations in batch
   * Optimizes API calls by batching address resolution and consent fetching
   */
  const buildPreviews = useCallback(
    async (conversations: Conversation[]): Promise<ConversationPreview[]> => {
      if (!client || conversations.length === 0) {
        return [];
      }

      // Phase 1: Separate DMs and Groups, get peer inbox IDs for DMs
      const dmData: { conversation: Dm; peerInboxId?: string }[] = [];
      const groupData: { conversation: Conversation }[] = [];

      for (const conv of conversations) {
        if (isDm(conv)) {
          dmData.push({ conversation: conv });
        } else {
          groupData.push({ conversation: conv });
        }
      }

      // Get all peer inbox IDs in parallel
      const peerInboxIdPromises = dmData.map(async (data) => {
        try {
          const inboxId = await data.conversation.peerInboxId();
          return { ...data, peerInboxId: inboxId };
        } catch {
          return data;
        }
      });
      const dmDataWithInboxIds = await Promise.all(peerInboxIdPromises);

      // Collect unique inbox IDs for batch fetching (Set for O(1) lookups)
      const uniqueInboxIdSet = new Set<string>();
      for (const data of dmDataWithInboxIds) {
        if (data.peerInboxId) {
          uniqueInboxIdSet.add(data.peerInboxId);
        }
      }
      const uniqueInboxIds = Array.from(uniqueInboxIdSet);

      // Phase 2: Batch fetch addresses (1 API call instead of N)
      const addressMap = await getAddressesForInboxIds(client, uniqueInboxIds);

      // Phase 3: Batch fetch consent states (parallel calls, consolidated error handling)
      const consentMap = await getInboxConsentStates(client, uniqueInboxIds);

      // Phase 4: Conditionally sync and fetch messages
      // When hideMessagePreviews is ON, skip expensive sync but still get cached lastMessage for timestamp
      const messageMap = new Map<string, { content: string; sentAt: Date; senderInboxId: string } | null>();

      if (!hideMessagePreviews) {
        // Full sync and fetch when previews are shown
        await Promise.allSettled(
          conversations.map((conv) => syncConversation(conv))
        );
      }

      // Fetch last messages in parallel (uses cached data when sync is skipped)
      const messagePromises = conversations.map(async (conv) => {
        try {
          const message = await getLatestMessage(conv);
          const isTextMessage = message && typeof message.content === 'string';
          return {
            id: conv.id,
            message: isTextMessage
              ? {
                  content: message.content as string,
                  sentAt: message.sentAt,
                  senderInboxId: message.senderInboxId,
                }
              : null,
          };
        } catch {
          return { id: conv.id, message: null };
        }
      });
      const messageResults = await Promise.allSettled(messagePromises);

      for (const result of messageResults) {
        if (result.status === 'fulfilled') {
          messageMap.set(result.value.id, result.value.message);
        }
      }

      // Phase 5: Assemble previews
      const previews: ConversationPreview[] = [];

      for (const conv of conversations) {
        const conversationIsDm = isDm(conv);
        let peerInboxId: string | undefined;
        let peerAddress: string | undefined;
        let consentState: ConsentState;
        let groupName: string | undefined;

        if (conversationIsDm) {
          const dmInfo = dmDataWithInboxIds.find((d) => d.conversation.id === conv.id);
          peerInboxId = dmInfo?.peerInboxId;
          peerAddress = peerInboxId ? (addressMap.get(peerInboxId) ?? undefined) : undefined;
          consentState = peerInboxId
            ? (consentMap.get(peerInboxId) ?? ConsentState.Unknown)
            : ConsentState.Unknown;
        } else {
          groupName = conv.name ?? undefined;
          consentState = ConsentState.Allowed; // Groups default to allowed
        }

        const lastMessage = messageMap.get(conv.id) ?? null;

        previews.push({
          id: conv.id,
          peerInboxId,
          peerAddress,
          groupName,
          lastMessage,
          consentState,
          unreadCount: 0, // TODO: Implement unread tracking
          createdAt: conv.createdAt ?? new Date(),
          isDm: conversationIsDm,
        });
      }

      return previews;
    },
    [client, hideMessagePreviews]
  );

  /**
   * Build a single conversation preview (for streaming new conversations)
   * Uses individual API calls - acceptable for single conversation at a time
   */
  const buildSinglePreview = useCallback(
    async (conversation: Conversation): Promise<ConversationPreview> => {
      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      const conversationIsDm = isDm(conversation);
      let peerInboxId: string | undefined;
      let peerAddress: string | undefined;
      let groupName: string | undefined;

      if (conversationIsDm) {
        // For DMs, get the peer inbox ID (async method)
        peerInboxId = await conversation.peerInboxId();
        // Resolve inbox ID to Ethereum address for display
        if (peerInboxId) {
          const address = await getAddressForInboxId(client, peerInboxId);
          peerAddress = address ?? undefined;
        }
      } else {
        // For Groups, get the group name
        groupName = conversation.name ?? undefined;
      }

      // Get consent state for DMs based on peer inbox, for groups based on conversation
      let consentState: ConsentState;
      if (conversationIsDm && peerInboxId) {
        consentState = await getInboxConsentState(client, peerInboxId);
      } else {
        // For groups, default to allowed for now (group consent handled separately)
        consentState = ConsentState.Allowed;
      }

      // Sync conversation only if previews are enabled (for streaming, we want fresh data)
      if (!hideMessagePreviews) {
        await syncConversation(conversation);
      }

      // Get the latest message (uses cached data when sync is skipped)
      const latestMessage = await getLatestMessage(conversation);

      // Only use text messages for preview (filter out system messages like group_updated)
      const isTextMessage = latestMessage && typeof latestMessage.content === 'string';

      return {
        id: conversation.id,
        peerInboxId,
        peerAddress,
        groupName,
        lastMessage: isTextMessage
          ? {
              content: latestMessage.content as string,
              sentAt: latestMessage.sentAt,
              senderInboxId: latestMessage.senderInboxId,
            }
          : null,
        consentState,
        unreadCount: 0, // TODO: Implement unread tracking
        createdAt: conversation.createdAt ?? new Date(),
        isDm: conversationIsDm,
      };
    },
    [client, hideMessagePreviews]
  );

  /**
   * Load all conversations and build previews using batch optimization
   */
  const loadConversations = useCallback(async () => {
    if (!client || !isInitialized) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Sync conversations from network first
      await syncConversations(client);

      // Get all conversations
      const conversations = await listConversations(client);

      // Build previews using batch optimization
      const previews = await buildPreviews(conversations);

      // Sort by last message date (most recent first)
      previews.sort((a, b) => {
        const aTime = a.lastMessage?.sentAt?.getTime() ?? a.createdAt.getTime();
        const bTime = b.lastMessage?.sentAt?.getTime() ?? b.createdAt.getTime();
        return bTime - aTime;
      });

      setState({
        conversations,
        previews,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load conversations');
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
      }));
      console.error('Failed to load conversations:', error);
    }
  }, [client, isInitialized, buildPreviews]);

  /**
   * Refresh conversations
   */
  const refresh = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  /**
   * Get a specific conversation by ID
   */
  const getConversation = useCallback(
    async (id: string): Promise<Conversation | null> => {
      if (!client) {
        return null;
      }
      return getConversationById(client, id);
    },
    [client]
  );

  // Load conversations on mount and when client changes
  useEffect(() => {
    if (isInitialized && client) {
      void loadConversations();
    }
  }, [isInitialized, client, loadConversations]);

  // Stream new conversations
  useEffect(() => {
    if (!client || !isInitialized) {
      return;
    }

    const cleanup = streamConversations(client, async (newConversation) => {
      try {
        // Build preview for the new conversation (single conversation, use individual builder)
        const preview = await buildSinglePreview(newConversation);

        setState((prev) => {
          // Check if conversation already exists
          const existingIndex = prev.conversations.findIndex(
            (c) => c.id === newConversation.id
          );

          if (existingIndex >= 0) {
            // Update existing conversation
            const updatedConversations = [...prev.conversations];
            updatedConversations[existingIndex] = newConversation;

            const updatedPreviews = [...prev.previews];
            const previewIndex = updatedPreviews.findIndex((p) => p.id === preview.id);
            if (previewIndex >= 0) {
              updatedPreviews[previewIndex] = preview;
            }

            return {
              ...prev,
              conversations: updatedConversations,
              previews: updatedPreviews,
            };
          }

          // Add new conversation at the beginning
          return {
            ...prev,
            conversations: [newConversation, ...prev.conversations],
            previews: [preview, ...prev.previews],
          };
        });
      } catch (err) {
        console.error('Failed to process new conversation:', err);
      }
    });

    return cleanup;
  }, [client, isInitialized, buildSinglePreview]);

  /**
   * Filter previews based on filter options
   */
  const filteredPreviews = useMemo(() => {
    if (!filter) {
      return state.previews;
    }

    return state.previews.filter((preview) => {
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
        const matchesInboxId = preview.peerInboxId?.toLowerCase().includes(query);
        const matchesGroupName = preview.groupName?.toLowerCase().includes(query);
        const matchesContent = preview.lastMessage?.content.toLowerCase().includes(query);

        if (!matchesInboxId && !matchesGroupName && !matchesContent) {
          return false;
        }
      }

      return true;
    });
  }, [state.previews, filter]);

  return {
    ...state,
    refresh,
    getConversation,
    filteredPreviews,
  };
}

/**
 * Hook to get only allowed conversations (for main chat view)
 */
export function useAllowedConversations() {
  return useConversations({ consentState: ConsentState.Allowed });
}

/**
 * Hook to get unknown/pending conversations (for message requests)
 */
export function useMessageRequests() {
  return useConversations({ consentState: ConsentState.Unknown });
}
