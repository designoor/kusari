'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useXmtpContext } from './XmtpProvider';
import { usePreferencesContext } from './PreferencesProvider';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { getConversationById } from '@/services/xmtp/conversations';
import { streamAllMessages } from '@/services/xmtp/messages';
import { sendReadReceipt } from '@/services/xmtp/readReceipts';
import {
  getCachedLastReadTimes,
  setCachedLastReadTime,
  getCachedUnreadCounts,
  setCachedUnreadCounts,
} from '@/lib/unread/storage';

/**
 * Context value for unread message tracking
 */
interface UnreadContextValue {
  /** Map of conversationId to unread count */
  unreadCounts: Map<string, number>;
  /** Total unread count across all conversations */
  totalUnreadCount: number;
  /** Map of conversationId to last read timestamp (nanoseconds) */
  lastReadTimes: Map<string, bigint>;
  /** Mark a conversation as read */
  markAsRead: (conversationId: string) => Promise<void>;
  /** Increment unread count for a conversation (called on new incoming message) */
  incrementUnread: (conversationId: string) => void;
  /** Set unread count for a conversation (e.g., after loading messages) */
  setUnreadCount: (conversationId: string, count: number) => void;
  /** Get the last read time for a conversation */
  getLastReadTime: (conversationId: string) => bigint;
}

const UnreadContext = createContext<UnreadContextValue | null>(null);

/**
 * Hook to access unread context from the provider.
 * Must be used within an UnreadProvider.
 */
export function useUnreadContext(): UnreadContextValue {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error('useUnreadContext must be used within UnreadProvider');
  }
  return context;
}

/**
 * Provider that manages unread message state at the app level.
 * Tracks unread counts per conversation and provides methods to mark as read.
 */
export function UnreadProvider({ children }: { children: React.ReactNode }) {
  const { client, isInitialized } = useXmtpContext();
  const { disableReadReceipts } = usePreferencesContext();
  const { address } = useWalletConnection();
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [lastReadTimes, setLastReadTimes] = useState<Map<string, bigint>>(new Map());

  // Get user address for localStorage keying
  const userAddress = address;

  // Load cached data on mount or when user changes
  useEffect(() => {
    if (!userAddress) {
      setLastReadTimes(new Map());
      setUnreadCounts(new Map());
      return;
    }

    // Load cached last read times
    const cachedTimes = getCachedLastReadTimes(userAddress);
    const times = new Map<string, bigint>();
    for (const [convId, timeStr] of cachedTimes) {
      times.set(convId, BigInt(timeStr));
    }
    setLastReadTimes(times);

    // Load cached unread counts
    const cachedCounts = getCachedUnreadCounts(userAddress);
    setUnreadCounts(cachedCounts);
  }, [userAddress]);

  // Persist unread counts to localStorage when they change
  useEffect(() => {
    if (!userAddress || unreadCounts.size === 0) {
      return;
    }
    setCachedUnreadCounts(userAddress, unreadCounts);
  }, [userAddress, unreadCounts]);

  /**
   * Mark a conversation as read
   * - Updates local state immediately for responsive UX
   * - Sends read receipt to XMTP network (if not disabled)
   * - Caches the read time in localStorage
   */
  const markAsRead = useCallback(
    async (conversationId: string) => {
      if (!client || !isInitialized || !userAddress) {
        return;
      }

      const now = BigInt(Date.now()) * BigInt(1_000_000); // Convert to nanoseconds

      // Update local state immediately for responsive UX
      setUnreadCounts((prev) => new Map(prev).set(conversationId, 0));
      setLastReadTimes((prev) => new Map(prev).set(conversationId, now));

      // Cache in localStorage
      setCachedLastReadTime(userAddress, conversationId, now);

      // Send read receipt to XMTP network (if privacy setting allows)
      if (!disableReadReceipts) {
        try {
          const conversation = await getConversationById(client, conversationId);
          if (conversation) {
            await sendReadReceipt(conversation);
          }
        } catch (error) {
          // Log but don't throw - local state is already updated
          console.error('Failed to send read receipt:', error);
        }
      }
    },
    [client, isInitialized, userAddress, disableReadReceipts]
  );

  /**
   * Increment unread count for a conversation
   * Called when a new incoming message is received
   */
  const incrementUnread = useCallback((conversationId: string) => {
    setUnreadCounts((prev) => {
      const current = prev.get(conversationId) ?? 0;
      return new Map(prev).set(conversationId, current + 1);
    });
  }, []);

  // Stream all messages to track unread counts in real-time
  // This is the ONLY place that increments unread counts on new messages
  // to avoid duplicate increments from multiple useConversations instances
  useEffect(() => {
    if (!client || !isInitialized) {
      return;
    }

    const cleanup = streamAllMessages(client, (message) => {
      // Only track text messages (not system messages like read receipts)
      const isTextMessage = typeof message.content === 'string';
      if (!isTextMessage) {
        return;
      }

      // Only increment for incoming messages (not messages we sent)
      const isIncomingMessage = message.senderInboxId !== client.inboxId;
      if (isIncomingMessage) {
        setUnreadCounts((prev) => {
          const current = prev.get(message.conversationId) ?? 0;
          return new Map(prev).set(message.conversationId, current + 1);
        });
      }
    });

    return cleanup;
  }, [client, isInitialized]);

  /**
   * Set unread count for a conversation
   * Used when computing exact count after loading messages
   */
  const setUnreadCount = useCallback((conversationId: string, count: number) => {
    setUnreadCounts((prev) => new Map(prev).set(conversationId, count));
  }, []);

  /**
   * Get the last read time for a conversation
   */
  const getLastReadTime = useCallback(
    (conversationId: string): bigint => {
      return lastReadTimes.get(conversationId) ?? BigInt(0);
    },
    [lastReadTimes]
  );

  /**
   * Compute total unread count across all conversations
   */
  const totalUnreadCount = useMemo(() => {
    let total = 0;
    for (const count of unreadCounts.values()) {
      total += count;
    }
    return total;
  }, [unreadCounts]);

  const value = useMemo(
    () => ({
      unreadCounts,
      totalUnreadCount,
      lastReadTimes,
      markAsRead,
      incrementUnread,
      setUnreadCount,
      getLastReadTime,
    }),
    [
      unreadCounts,
      totalUnreadCount,
      lastReadTimes,
      markAsRead,
      incrementUnread,
      setUnreadCount,
      getLastReadTime,
    ]
  );

  return (
    <UnreadContext.Provider value={value}>
      {children}
    </UnreadContext.Provider>
  );
}
