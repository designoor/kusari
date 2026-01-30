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
} from '@/services/xmtp/messages';
import { getLastReadTimes } from '@/services/xmtp/readReceipts';
import { getAddressesForInboxIds } from '@/services/xmtp/identity';
import type { Conversation } from '@/types/conversation';
import type { MessageDisplay, PendingMessage, MessageGroup, MessageType } from '@/types/message';
import { truncateAddress } from '@/lib/address';

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
}

/**
 * Get display name for an inbox ID (resolved address or truncated inbox ID)
 */
function getDisplayName(inboxId: string, addressMap: Map<string, string | null>): string {
  const address = addressMap.get(inboxId);
  return truncateAddress(address ?? inboxId);
}

/**
 * Convert group_updated content to a human-readable system message
 */
function formatGroupUpdatedMessage(
  content: GroupUpdatedContent,
  initiatorId: string | undefined,
  addressMap: Map<string, string | null>
): string {
  const initiator = initiatorId ? getDisplayName(initiatorId, addressMap) : 'Someone';

  // Check for added members
  const addedInboxes = content.addedInboxes ?? [];
  if (addedInboxes.length > 0) {
    const firstAdded = addedInboxes[0];
    if (addedInboxes.length === 1 && firstAdded) {
      const addedId = firstAdded.inboxId;
      // Check if the person added themselves (joined)
      if (addedId === initiatorId) {
        return `${getDisplayName(addedId, addressMap)} joined the conversation`;
      }
      return `${initiator} added ${getDisplayName(addedId, addressMap)} to the conversation`;
    }
    return `${initiator} added ${addedInboxes.length} members to the conversation`;
  }

  // Check for removed members
  const removedInboxes = content.removedInboxes ?? [];
  if (removedInboxes.length > 0) {
    const firstRemoved = removedInboxes[0];
    if (removedInboxes.length === 1 && firstRemoved) {
      return `${initiator} removed ${getDisplayName(firstRemoved.inboxId, addressMap)} from the conversation`;
    }
    return `${initiator} removed ${removedInboxes.length} members from the conversation`;
  }

  // Check for members who left
  const leftInboxes = content.leftInboxes ?? [];
  if (leftInboxes.length > 0) {
    const firstLeft = leftInboxes[0];
    if (leftInboxes.length === 1 && firstLeft) {
      return `${getDisplayName(firstLeft.inboxId, addressMap)} left the conversation`;
    }
    return `${leftInboxes.length} members left the conversation`;
  }

  // Check for admin changes
  const addedAdmins = content.addedAdminInboxes ?? [];
  if (addedAdmins.length > 0) {
    const firstAdmin = addedAdmins[0];
    if (firstAdmin) {
      return `${initiator} made ${getDisplayName(firstAdmin.inboxId, addressMap)} an admin`;
    }
  }

  const removedAdmins = content.removedAdminInboxes ?? [];
  if (removedAdmins.length > 0) {
    const firstRemovedAdmin = removedAdmins[0];
    if (firstRemovedAdmin) {
      return `${initiator} removed admin rights from ${getDisplayName(firstRemovedAdmin.inboxId, addressMap)}`;
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
  /** Peer's last read timestamp in nanoseconds (for read receipt UI) */
  peerLastReadTime: bigint | null;
  /** Whether the conversation is active (can send messages). Inactive conversations are read-only. */
  isActive: boolean;
}

/**
 * Hook to manage messages for a specific conversation
 * Provides message list, streaming updates, send functionality, and real-time read receipts
 *
 * @param conversationId The ID of the conversation to manage messages for
 * @returns Message state and helper methods
 */
export function useMessages(conversationId: string | null): UseMessagesReturn {
  const { client, isInitialized } = useXmtpContext();
  const { markAsRead } = useUnreadContext();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [state, setState] = useState<UseMessagesState>({
    messages: [],
    pendingMessages: [],
    isLoading: false,
    isSending: false,
    error: null,
  });

  // Read receipt state - updated from initial fetch and real-time stream
  const [peerLastReadTime, setPeerLastReadTime] = useState<bigint | null>(null);

  // Address resolution map for system messages (inbox ID -> Ethereum address)
  const [inboxAddressMap, setInboxAddressMap] = useState<Map<string, string | null>>(new Map());

  /**
   * Load all messages for the conversation
   */
  const loadMessages = useCallback(async () => {
    if (!conversation) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load messages from local cache
      // We don't sync here to avoid "inactive" conversation issues
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
      setIsActive(true);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const conv = await getConversationById(client, conversationId);
        if (!cancelled && conv) {
          setConversation(conv);
          // Check if conversation is active (can send messages)
          // Inactive conversations are read-only (e.g., imported from another device)
          const active = await conv.isActive();
          if (!cancelled) {
            setIsActive(active);
          }
        } else if (!cancelled) {
          setConversation(null);
          setIsActive(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load conversation:', err);
          setConversation(null);
          setIsActive(true);
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
        // Load messages from local cache
        // We don't sync here to avoid "inactive" conversation issues
        // New messages arrive via streaming
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

  // Stream new messages and read receipts
  useEffect(() => {
    if (!conversation || !client) {
      return;
    }

    const currentInboxId = client.inboxId;

    const cleanup = streamMessages(conversation, (newMessage) => {
      // Check if this is a read receipt from the peer
      const contentType = newMessage.contentType as ContentType | undefined;
      if (contentType?.typeId === 'readReceipt') {
        // Only update if this read receipt is from the peer (not ourselves)
        if (newMessage.senderInboxId !== currentInboxId) {
          // The sentAtNs of the read receipt indicates when it was sent,
          // which means the peer has read all messages up to this point
          setPeerLastReadTime((prev) => {
            // Only update if this is a newer read time
            if (!prev || newMessage.sentAtNs > prev) {
              return newMessage.sentAtNs;
            }
            return prev;
          });
        }
        // Don't add read receipts to the message list
        return;
      }

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

  // Fetch initial read times when conversation loads
  useEffect(() => {
    if (!conversation || !client) {
      setPeerLastReadTime(null);
      return;
    }

    const currentInboxId = client.inboxId;

    const fetchInitialReadTimes = async () => {
      try {
        const lastReadTimesMap = await getLastReadTimes(conversation);

        // Find the peer's last read time (not our own)
        for (const [inboxId, timestamp] of lastReadTimesMap) {
          if (inboxId !== currentInboxId) {
            setPeerLastReadTime(timestamp);
            break;
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial read times:', error);
      }
    };

    void fetchInitialReadTimes();
  }, [conversation, client]);

  // Mark conversation as read when messages are loaded
  useEffect(() => {
    if (conversationId && !state.isLoading && state.messages.length > 0) {
      void markAsRead(conversationId);
    }
  }, [conversationId, state.isLoading, state.messages.length, markAsRead]);

  // Resolve inbox IDs to Ethereum addresses for system messages
  useEffect(() => {
    if (!client || state.messages.length === 0) {
      return;
    }

    // Extract all unique inbox IDs from system messages
    const inboxIds = new Set<string>();
    for (const msg of state.messages) {
      const contentType = msg.contentType as ContentType | undefined;
      if (contentType?.typeId === 'group_updated' && msg.content) {
        const groupContent = msg.content as GroupUpdatedContent;

        // Collect all inbox IDs from the update
        if (groupContent.initiatedByInboxId) {
          inboxIds.add(groupContent.initiatedByInboxId);
        }
        for (const item of groupContent.addedInboxes ?? []) {
          inboxIds.add(item.inboxId);
        }
        for (const item of groupContent.removedInboxes ?? []) {
          inboxIds.add(item.inboxId);
        }
        for (const item of groupContent.leftInboxes ?? []) {
          inboxIds.add(item.inboxId);
        }
        for (const item of groupContent.addedAdminInboxes ?? []) {
          inboxIds.add(item.inboxId);
        }
        for (const item of groupContent.removedAdminInboxes ?? []) {
          inboxIds.add(item.inboxId);
        }
      }
    }

    // Skip if no inbox IDs to resolve or all are already resolved
    const unresolved = Array.from(inboxIds).filter((id) => !inboxAddressMap.has(id));
    if (unresolved.length === 0) {
      return;
    }

    let cancelled = false;
    const resolve = async () => {
      try {
        const resolved = await getAddressesForInboxIds(client, unresolved);
        if (!cancelled) {
          setInboxAddressMap((prev) => {
            const updated = new Map(prev);
            for (const [inboxId, address] of resolved) {
              updated.set(inboxId, address);
            }
            return updated;
          });
        }
      } catch (error) {
        console.error('Failed to resolve inbox IDs to addresses:', error);
      }
    };

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [client, state.messages, inboxAddressMap]);

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
          const isFromCurrentUser = msg.senderInboxId === currentInboxId;

          // Determine status: check if message has been read by peer
          let status: MessageDisplay['status'] = 'sent';
          if (isFromCurrentUser && peerLastReadTime && msg.sentAtNs <= peerLastReadTime) {
            status = 'read';
          }

          return {
            id: msg.id,
            content: msg.content,
            senderInboxId: msg.senderInboxId,
            sentAt: msg.sentAt,
            sentAtNs: msg.sentAtNs,
            isFromCurrentUser,
            status,
            type: 'text' as MessageType,
          };
        }

        // System messages (group_updated, etc.)
        const contentType = msg.contentType as ContentType | undefined;
        if (contentType?.typeId === 'group_updated' && msg.content) {
          const groupContent = msg.content as GroupUpdatedContent;
          return {
            id: msg.id,
            content: formatGroupUpdatedMessage(groupContent, groupContent.initiatedByInboxId, inboxAddressMap),
            senderInboxId: msg.senderInboxId,
            sentAt: msg.sentAt,
            sentAtNs: msg.sentAtNs,
            isFromCurrentUser: false, // System messages are never "from current user"
            status: 'sent' as const,
            type: 'system' as MessageType,
          };
        }

        // Skip other non-text content types (readReceipt, reactions, etc.)
        return null;
      })
      .filter((msg): msg is MessageDisplay => msg !== null);

    // Convert pending messages
    const pending: MessageDisplay[] = state.pendingMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderInboxId: currentInboxId,
      sentAt: msg.createdAt,
      sentAtNs: BigInt(msg.createdAt.getTime()) * BigInt(1_000_000),
      isFromCurrentUser: true,
      status: msg.status,
      type: 'text' as MessageType,
    }));

    // Combine and sort by time
    return [...regularMessages, ...pending].sort(
      (a, b) => a.sentAt.getTime() - b.sentAt.getTime()
    );
  }, [client, state.messages, state.pendingMessages, peerLastReadTime, inboxAddressMap]);

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
    peerLastReadTime,
    isActive,
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
