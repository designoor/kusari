import type { DecodedMessage } from '@xmtp/browser-sdk';

export type { DecodedMessage };

/**
 * Message display state for UI
 */
export interface MessageDisplay {
  id: string;
  content: string;
  senderInboxId: string;
  sentAt: Date;
  isFromCurrentUser: boolean;
  status: MessageStatus;
}

/**
 * Message status for optimistic UI updates
 */
export type MessageStatus = 'sending' | 'sent' | 'failed';

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
