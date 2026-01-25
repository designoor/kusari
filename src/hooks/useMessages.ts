'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DecodedMessage } from '@xmtp/browser-sdk';
import { useXmtpContext } from '@/providers/XmtpProvider';
import { useUnreadContext } from '@/providers/UnreadProvider';
import { getConversationById } from '@/services/xmtp/conversations';
import {
  listMessages,
  sendMessage as sendMessageService,
  streamMessages,
  syncConversation,
} from '@/services/xmtp/messages';
import type { Conversation } from '@/types/conversation';
import type { MessageDisplay, PendingMessage, MessageGroup, MessageType } from '@/types/message';
import { truncateAddress } from '@/lib/address';

/**
 * XMTP group_updated content structure
 */
interface GroupUpdatedContent {
  addedInboxes?: { inboxId: string }[];
  removedInboxes?: { inboxId: string }[];
  leftInboxes?: { inboxId: string }[];
  initiatedByInboxId?: string;
  addedAdminInboxes?: { inboxId: string }[];
  removedAdminInboxes?: { inboxId: string }[];
  addedSuperAdminInboxes?: { inboxId: string }[];
  removedSuperAdminInboxes?: { inboxId: string }[];
  metadataFieldChanges?: unknown[];
}

/**
 * XMTP content type structure
 */
interface ContentType {
  authorityId: string;
  typeId: string;
  versionMajor: number;
  versionMinor: number;
}

/**
 * Convert group_updated content to a human-readable system message
 */
function formatGroupUpdatedMessage(content: GroupUpdatedContent, initiatorId?: string): string {
  const initiator = initiatorId ? truncateAddress(initiatorId) : 'Someone';

  // Check for added members
  const addedInboxes = content.addedInboxes ?? [];
  if (addedInboxes.length > 0) {
    const firstAdded = addedInboxes[0];
    if (addedInboxes.length === 1 && firstAdded) {
      const addedId = firstAdded.inboxId;
      // Check if the person added themselves (joined)
      if (addedId === initiatorId) {
        return `${truncateAddress(addedId)} joined the conversation`;
      }
      return `${initiator} added ${truncateAddress(addedId)} to the conversation`;
    }
    return `${initiator} added ${addedInboxes.length} members to the conversation`;
  }

  // Check for removed members
  const removedInboxes = content.removedInboxes ?? [];
  if (removedInboxes.length > 0) {
    const firstRemoved = removedInboxes[0];
    if (removedInboxes.length === 1 && firstRemoved) {
      return `${initiator} removed ${truncateAddress(firstRemoved.inboxId)} from the conversation`;
    }
    return `${initiator} removed ${removedInboxes.length} members from the conversation`;
  }

  // Check for members who left
  const leftInboxes = content.leftInboxes ?? [];
  if (leftInboxes.length > 0) {
    const firstLeft = leftInboxes[0];
    if (leftInboxes.length === 1 && firstLeft) {
      return `${truncateAddress(firstLeft.inboxId)} left the conversation`;
    }
    return `${leftInboxes.length} members left the conversation`;
  }

  // Check for admin changes
  const addedAdmins = content.addedAdminInboxes ?? [];
  if (addedAdmins.length > 0) {
    const firstAdmin = addedAdmins[0];
    if (firstAdmin) {
      return `${initiator} made ${truncateAddress(firstAdmin.inboxId)} an admin`;
    }
  }

  const removedAdmins = content.removedAdminInboxes ?? [];
  if (removedAdmins.length > 0) {
    const firstRemovedAdmin = removedAdmins[0];
    if (firstRemovedAdmin) {
      return `${initiator} removed admin rights from ${truncateAddress(firstRemovedAdmin.inboxId)}`;
    }
  }

  // Default fallback
  return 'Conversation was updated';
}

interface UseMessagesState {
  messages: DecodedMessage[];
  pendingMessages: PendingMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: Error | null;
}

interface UseMessagesReturn extends UseMessagesState {
  displayMessages: MessageDisplay[];
  messageGroups: MessageGroup[];
  sendMessage: (content: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage messages for a specific conversation
 * Provides message list, streaming updates, and send functionality
 *
 * @param conversationId The ID of the conversation to manage messages for
 * @returns Message state and helper methods
 */
export function useMessages(conversationId: string | null): UseMessagesReturn {
  const { client, isInitialized } = useXmtpContext();
  const { markAsRead } = useUnreadContext();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [state, setState] = useState<UseMessagesState>({
    messages: [],
    pendingMessages: [],
    isLoading: false,
    isSending: false,
    error: null,
  });

  /**
   * Load all messages for the conversation
   */
  const loadMessages = useCallback(async () => {
    if (!conversation) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Sync conversation first to get latest messages
      await syncConversation(conversation);

      // Load all messages
      const messages = await listMessages(conversation);

      setState((prev) => ({
        ...prev,
        messages,
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load messages');
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
      }));
      console.error('Failed to load messages:', error);
    }
  }, [conversation]);

  /**
   * Refresh messages
   */
  const refresh = useCallback(async () => {
    await loadMessages();
  }, [loadMessages]);

  /**
   * Send a message to the conversation
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversation || !content.trim()) {
        return;
      }

      const pendingId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const pendingMessage: PendingMessage = {
        id: pendingId,
        content: content.trim(),
        status: 'sending',
        createdAt: new Date(),
      };

      // Add pending message for optimistic UI
      setState((prev) => ({
        ...prev,
        pendingMessages: [...prev.pendingMessages, pendingMessage],
        isSending: true,
      }));

      try {
        // Send the message
        await sendMessageService(conversation, content.trim());

        // Remove pending message on success (the streamed message will replace it)
        setState((prev) => ({
          ...prev,
          pendingMessages: prev.pendingMessages.filter((m) => m.id !== pendingId),
          isSending: false,
        }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to send message');

        // Update pending message to failed status
        setState((prev) => ({
          ...prev,
          pendingMessages: prev.pendingMessages.map((m) =>
            m.id === pendingId ? { ...m, status: 'failed' as const, error: error.message } : m
          ),
          isSending: false,
        }));

        console.error('Failed to send message:', error);
      }
    },
    [conversation]
  );

  // Load conversation when ID changes (with race condition protection)
  useEffect(() => {
    if (!isInitialized || !client || !conversationId) {
      setConversation(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const conv = await getConversationById(client, conversationId);
        if (!cancelled) {
          setConversation(conv);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load conversation:', err);
          setConversation(null);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [isInitialized, client, conversationId]);

  // Load messages when conversation changes (with race condition protection)
  useEffect(() => {
    if (!conversation) {
      // Clear messages when no conversation
      setState({
        messages: [],
        pendingMessages: [],
        isLoading: false,
        isSending: false,
        error: null,
      });
      return;
    }

    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        await syncConversation(conversation);
        const messages = await listMessages(conversation);

        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            messages,
            isLoading: false,
            error: null,
          }));
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Failed to load messages');
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error,
          }));
          console.error('Failed to load messages:', error);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [conversation]);

  // Stream new messages
  useEffect(() => {
    if (!conversation || !client) {
      return;
    }

    const currentInboxId = client.inboxId;

    const cleanup = streamMessages(conversation, (newMessage) => {
      setState((prev) => {
        // Check if message already exists
        const exists = prev.messages.some((m) => m.id === newMessage.id);
        if (exists) {
          return prev;
        }

        // If this is a message from the current user, clear any matching pending messages
        // This prevents the brief duplicate when the streamed message arrives before
        // the sendMessage promise resolves
        let updatedPendingMessages = prev.pendingMessages;
        if (newMessage.senderInboxId === currentInboxId && typeof newMessage.content === 'string') {
          // Remove pending messages with matching content (optimistic UI cleanup)
          updatedPendingMessages = prev.pendingMessages.filter(
            (pending) => pending.content !== newMessage.content
          );
        }

        // Add new message and clean up pending
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          pendingMessages: updatedPendingMessages,
        };
      });
    });

    return cleanup;
  }, [conversation, client]);

  // Mark conversation as read when messages are loaded
  useEffect(() => {
    if (conversationId && !state.isLoading && state.messages.length > 0) {
      void markAsRead(conversationId);
    }
  }, [conversationId, state.isLoading, state.messages.length, markAsRead]);

  /**
   * Convert messages to display format
   */
  const displayMessages = useMemo((): MessageDisplay[] => {
    if (!client || !client.inboxId) {
      return [];
    }

    const currentInboxId = client.inboxId;

    // Convert all messages (text and system)
    const regularMessages: MessageDisplay[] = state.messages
      .map((msg): MessageDisplay | null => {
        // Text messages (string content)
        if (typeof msg.content === 'string') {
          return {
            id: msg.id,
            content: msg.content,
            senderInboxId: msg.senderInboxId,
            sentAt: msg.sentAt,
            isFromCurrentUser: msg.senderInboxId === currentInboxId,
            status: 'sent' as const,
            type: 'text' as MessageType,
          };
        }

        // System messages (group_updated, etc.)
        const contentType = msg.contentType as ContentType | undefined;
        if (contentType?.typeId === 'group_updated' && msg.content) {
          const groupContent = msg.content as GroupUpdatedContent;
          return {
            id: msg.id,
            content: formatGroupUpdatedMessage(groupContent, groupContent.initiatedByInboxId),
            senderInboxId: msg.senderInboxId,
            sentAt: msg.sentAt,
            isFromCurrentUser: false, // System messages are never "from current user"
            status: 'sent' as const,
            type: 'system' as MessageType,
          };
        }

        // Skip other non-text content types (read_receipts, reactions, etc.)
        return null;
      })
      .filter((msg): msg is MessageDisplay => msg !== null);

    // Convert pending messages
    const pending: MessageDisplay[] = state.pendingMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderInboxId: currentInboxId,
      sentAt: msg.createdAt,
      isFromCurrentUser: true,
      status: msg.status,
      type: 'text' as MessageType,
    }));

    // Combine and sort by time
    return [...regularMessages, ...pending].sort(
      (a, b) => a.sentAt.getTime() - b.sentAt.getTime()
    );
  }, [client, state.messages, state.pendingMessages]);

  /**
   * Group consecutive messages from the same sender
   * System messages are always in their own group
   */
  const messageGroups = useMemo((): MessageGroup[] => {
    if (displayMessages.length === 0) {
      return [];
    }

    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    for (const message of displayMessages) {
      // System messages always get their own group
      const isSystemMessage = message.type === 'system';
      const previousWasSystem = currentGroup?.messages[0]?.type === 'system';

      if (
        !currentGroup ||
        isSystemMessage ||
        previousWasSystem ||
        currentGroup.senderInboxId !== message.senderInboxId ||
        // Start new group if messages are more than 5 minutes apart
        message.sentAt.getTime() - currentGroup.timestamp.getTime() > 5 * 60 * 1000
      ) {
        // Start a new group
        currentGroup = {
          senderInboxId: message.senderInboxId,
          isFromCurrentUser: message.isFromCurrentUser,
          messages: [message],
          timestamp: message.sentAt,
        };
        groups.push(currentGroup);
      } else {
        // Add to current group
        currentGroup.messages.push(message);
      }
    }

    return groups;
  }, [displayMessages]);

  return {
    ...state,
    displayMessages,
    messageGroups,
    sendMessage,
    refresh,
  };
}

/**
 * Hook to get a single conversation with its messages
 */
export function useConversationWithMessages(conversationId: string | null) {
  const messages = useMessages(conversationId);
  const { client } = useXmtpContext();
  const [conversation, setConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (!client || !conversationId) {
      setConversation(null);
      return;
    }

    const loadConv = async () => {
      try {
        const conv = await getConversationById(client, conversationId);
        setConversation(conv);
      } catch (err) {
        console.error('Failed to load conversation:', err);
        setConversation(null);
      }
    };

    void loadConv();
  }, [client, conversationId]);

  return {
    conversation,
    ...messages,
  };
}
