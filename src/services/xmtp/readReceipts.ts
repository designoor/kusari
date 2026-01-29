import type { Conversation } from '@/types/conversation';

/**
 * Send a read receipt for a conversation
 * This notifies other participants that the current user has read the conversation
 * @param conversation Conversation instance
 * @returns The read receipt message ID, or null if failed (e.g., inactive conversation)
 */
export async function sendReadReceipt(conversation: Conversation): Promise<string | null> {
  try {
    const messageId = await conversation.sendReadReceipt();
    return messageId;
  } catch (error) {
    // Silently handle "inactive" errors - read receipts are non-critical
    if (error instanceof Error && error.message.includes('inactive')) {
      return null;
    }
    console.error('Failed to send read receipt:', error);
    return null;
  }
}

/**
 * Get last read times for all participants in a conversation
 * @param conversation Conversation instance
 * @returns Map of inboxId to timestamp in nanoseconds (bigint)
 */
export async function getLastReadTimes(
  conversation: Conversation
): Promise<Map<string, bigint>> {
  try {
    const lastReadTimes = await conversation.lastReadTimes();
    return lastReadTimes;
  } catch (error) {
    console.error('Failed to get last read times:', error);
    return new Map();
  }
}

/**
 * Batch fetch last read times for multiple conversations
 * Uses Promise.allSettled for resilience against individual failures
 * @param conversations Array of conversations
 * @returns Map of conversationId to Map of inboxId to timestamp
 */
export async function batchGetLastReadTimes(
  conversations: Conversation[]
): Promise<Map<string, Map<string, bigint>>> {
  const results = await Promise.allSettled(
    conversations.map(async (conv) => ({
      id: conv.id,
      times: await conv.lastReadTimes(),
    }))
  );

  const map = new Map<string, Map<string, bigint>>();
  for (const result of results) {
    if (result.status === 'fulfilled') {
      map.set(result.value.id, result.value.times);
    }
  }
  return map;
}
