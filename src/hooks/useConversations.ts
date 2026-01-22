'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ConsentState } from '@xmtp/browser-sdk';
import { useXmtpContext } from '@/providers/XmtpProvider';
import {
  listConversations,
  streamConversations,
  syncConversations,
  getConversationById,
} from '@/services/xmtp/conversations';
import { getLatestMessage, syncConversation } from '@/services/xmtp/messages';
import { getInboxConsentState } from '@/services/xmtp/consent';
import { getAddressForInboxId } from '@/services/xmtp/identity';
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
 * @param filter Optional filter to apply to conversation list
 * @returns Conversation state and helper methods
 */
export function useConversations(filter?: ConversationFilter): UseConversationsReturn {
  const { client, isInitialized } = useXmtpContext();
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
   * Build a conversation preview from a conversation
   */
  const buildPreview = useCallback(
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

      // Sync conversation to ensure we have the latest messages
      await syncConversation(conversation);

      // Get the latest message
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
    [client]
  );

  /**
   * Load all conversations and build previews
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

      // Build previews for all conversations (use allSettled for resilience)
      const previewPromises = conversations.map((conv) => buildPreview(conv));
      const results = await Promise.allSettled(previewPromises);

      // Filter out failed previews and log errors
      const previews: ConversationPreview[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          previews.push(result.value);
        } else {
          console.error('Failed to build conversation preview:', result.reason);
        }
      }

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
  }, [client, isInitialized, buildPreview]);

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
        // Build preview for the new conversation
        const preview = await buildPreview(newConversation);

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
  }, [client, isInitialized, buildPreview]);

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
