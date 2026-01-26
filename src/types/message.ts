import type { DecodedMessage } from '@xmtp/browser-sdk';

export type { DecodedMessage };

/**
 * Message type for distinguishing user messages from system messages
 */
export type MessageType = 'text' | 'system';

/**
 * Message display state for UI
 */
export interface MessageDisplay {
  id: string;
  content: string;
  senderInboxId: string;
  sentAt: Date;
  /** Sent time in nanoseconds for precise read receipt comparison */
  sentAtNs: bigint;
  isFromCurrentUser: boolean;
  status: MessageStatus;
  /** Type of message - 'text' for user messages, 'system' for membership changes etc. */
  type: MessageType;
}

/**
 * Message status for optimistic UI updates
 */
export type MessageStatus = 'sending' | 'sent' | 'failed' | 'read';

/**
 * Pending message (optimistic UI)
 */
export interface PendingMessage {
  id: string;
  content: string;
  status: MessageStatus;
  createdAt: Date;
  error?: string;
}

/**
 * Message group for displaying consecutive messages from same sender
 */
export interface MessageGroup {
  senderInboxId: string;
  isFromCurrentUser: boolean;
  messages: MessageDisplay[];
  timestamp: Date;
}

/**
 * Message send options
 */
export interface SendMessageOptions {
  conversationId: string;
  content: string;
  optimisticId?: string;
}
