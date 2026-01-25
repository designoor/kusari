'use client';

import { useUnreadContext } from '@/providers/UnreadProvider';

/**
 * Hook to get unread count for a specific conversation
 * @param conversationId The conversation ID to get unread count for
 * @returns The unread count for the conversation
 */
export function useUnreadCount(conversationId: string | null): number {
  const { unreadCounts } = useUnreadContext();
  if (!conversationId) return 0;
  return unreadCounts.get(conversationId) ?? 0;
}

/**
 * Hook to get total unread count across all conversations
 * Used for nav badge display
 * @returns Total unread message count
 */
export function useTotalUnreadCount(): number {
  const { totalUnreadCount } = useUnreadContext();
  return totalUnreadCount;
}

/**
 * Hook to get the mark as read function
 * @returns Function to mark a conversation as read
 */
export function useMarkAsRead(): (conversationId: string) => Promise<void> {
  const { markAsRead } = useUnreadContext();
  return markAsRead;
}

/**
 * Hook to get the increment unread function
 * @returns Function to increment unread count for a conversation
 */
export function useIncrementUnread(): (conversationId: string) => void {
  const { incrementUnread } = useUnreadContext();
  return incrementUnread;
}

/**
 * Hook to get the set unread count function
 * @returns Function to set unread count for a conversation
 */
export function useSetUnreadCount(): (conversationId: string, count: number) => void {
  const { setUnreadCount } = useUnreadContext();
  return setUnreadCount;
}

/**
 * Hook to get the last read time for a conversation
 * @returns Function to get last read time (nanoseconds)
 */
export function useGetLastReadTime(): (conversationId: string) => bigint {
  const { getLastReadTime } = useUnreadContext();
  return getLastReadTime;
}
