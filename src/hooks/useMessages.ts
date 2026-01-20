'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { DecodedMessage } from '@xmtp/browser-sdk';
import { useXmtpContext } from '@/providers/XmtpProvider';
import { getConversationById } from '@/services/xmtp/conversations';
import {
  listMessages,
  sendMessage as sendMessageService,
  streamMessages,
  syncConversation,
} from '@/services/xmtp/messages';
import type { Conversation } from '@/types/conversation';
import type { MessageDisplay, PendingMessage, MessageGroup } from '@/types/message';

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
    if (!conversation) {
      return;
    }

    const cleanup = streamMessages(conversation, (newMessage) => {
      setState((prev) => {
        // Check if message already exists
        const exists = prev.messages.some((m) => m.id === newMessage.id);
        if (exists) {
          return prev;
        }

        // Add new message
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
        };
      });
    });

    return cleanup;
  }, [conversation]);

  /**
   * Convert messages to display format
   */
  const displayMessages = useMemo((): MessageDisplay[] => {
    if (!client || !client.inboxId) {
      return [];
    }

    const currentInboxId = client.inboxId;

    // Convert regular messages
    const regularMessages: MessageDisplay[] = state.messages.map((msg) => ({
      id: msg.id,
      content: typeof msg.content === 'string' ? msg.content : '[Unsupported content]',
      senderInboxId: msg.senderInboxId,
      sentAt: msg.sentAt,
      isFromCurrentUser: msg.senderInboxId === currentInboxId,
      status: 'sent' as const,
    }));

    // Convert pending messages
    const pending: MessageDisplay[] = state.pendingMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderInboxId: currentInboxId,
      sentAt: msg.createdAt,
      isFromCurrentUser: true,
      status: msg.status,
    }));

    // Combine and sort by time
    return [...regularMessages, ...pending].sort(
      (a, b) => a.sentAt.getTime() - b.sentAt.getTime()
    );
  }, [client, state.messages, state.pendingMessages]);

  /**
   * Group consecutive messages from the same sender
   */
  const messageGroups = useMemo((): MessageGroup[] => {
    if (displayMessages.length === 0) {
      return [];
    }

    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    for (const message of displayMessages) {
      if (
        !currentGroup ||
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
