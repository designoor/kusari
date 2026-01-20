import type { DecodedMessage, ListMessagesOptions } from '@xmtp/browser-sdk';
import type { Conversation } from '@/types/conversation';

/**
 * Fetch all messages from a conversation
 * @param conversation Conversation instance
 * @param options Optional pagination/filtering options
 * @returns Array of decoded messages
 */
export async function listMessages(
  conversation: Conversation,
  options?: ListMessagesOptions
): Promise<DecodedMessage[]> {
  try {
    // XMTP SDK's messages() method returns messages in chronological order
    const messages = await conversation.messages(options);
    return messages;
  } catch (error) {
    console.error('Failed to list messages:', error);
    throw new Error('Failed to list messages');
  }
}

/**
 * Send a text message to a conversation
 * @param conversation Conversation instance
 * @param content Message content (text string)
 * @returns The sent message ID
 */
export async function sendMessage(
  conversation: Conversation,
  content: string
): Promise<string> {
  try {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    // Send the message using sendText and get the message ID
    const messageId = await conversation.sendText(content);
    return messageId;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw new Error('Failed to send message');
  }
}

/**
 * Stream new messages from a conversation in real-time
 * @param conversation Conversation instance
 * @param onMessage Callback function called for each new message
 * @returns Cleanup function to stop streaming
 */
export function streamMessages(
  conversation: Conversation,
  onMessage: (message: DecodedMessage) => void
): () => void {
  let isStopped = false;
  let stream: Awaited<ReturnType<typeof conversation.stream>> | null = null;

  (async () => {
    try {
      stream = await conversation.stream();

      for await (const message of stream) {
        if (isStopped) break;
        onMessage(message);
      }
    } catch (error) {
      if (!isStopped) {
        console.error('Message stream error:', error);
      }
    }
  })();

  // Return cleanup function
  return () => {
    isStopped = true;
    if (stream) {
      void stream.return();
    }
  };
}

/**
 * Get the most recent message from a conversation
 * @param conversation Conversation instance
 * @returns Most recent message or null if no messages exist
 * @throws Error if latest message cannot be retrieved (network error, etc.)
 */
export async function getLatestMessage(
  conversation: Conversation
): Promise<DecodedMessage | null> {
  try {
    const message = await conversation.lastMessage();
    return message || null;
  } catch (error) {
    console.error('Failed to get latest message:', error);
    throw new Error('Failed to get latest message');
  }
}

/**
 * Count messages in a conversation
 * @param conversation Conversation instance
 * @param options Optional filtering options
 * @returns Number of messages
 * @throws Error if message count cannot be retrieved
 */
export async function countMessages(
  conversation: Conversation,
  options?: Omit<ListMessagesOptions, 'limit' | 'direction'>
): Promise<number> {
  try {
    const count = await conversation.countMessages(options);
    return Number(count);
  } catch (error) {
    console.error('Failed to count messages:', error);
    throw new Error('Failed to count messages');
  }
}

/**
 * Prepare a conversation for messaging by syncing its state
 * This is useful before displaying a conversation to ensure all messages are loaded
 * @param conversation Conversation instance
 */
export async function syncConversation(
  conversation: Conversation
): Promise<void> {
  try {
    await conversation.sync();
  } catch (error) {
    console.error('Failed to sync conversation:', error);
    throw new Error('Failed to sync conversation');
  }
}
