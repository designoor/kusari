import type { Dm, Group, DecodedMessage } from '@xmtp/browser-sdk';
import type { ConsentState } from './consent';

export type Conversation = Dm | Group;
export type { Dm, Group };

/**
 * Conversation preview for display in list view
 * Contains essential info without loading all messages
 */
export interface ConversationPreview {
  id: string;
  peerInboxId?: string; // Only for DMs
  groupName?: string; // Only for Groups
  lastMessage: {
    content: string;
    sentAt: Date;
    senderInboxId: string;
  } | null;
  consentState: ConsentState;
  unreadCount: number;
  createdAt: Date;
  isDm: boolean;
}

/**
 * Extended conversation data with messages
 */
export interface ConversationWithMessages {
  conversation: Conversation;
  messages: DecodedMessage[];
  consentState: ConsentState;
}

/**
 * Conversation list filter options
 */
export interface ConversationFilter {
  consentState?: ConsentState;
  searchQuery?: string;
  hasMessages?: boolean;
  conversationType?: 'dm' | 'group';
}

/**
 * Conversation sort options
 */
export type ConversationSortBy =
  | 'lastMessage'
  | 'createdAt'
  | 'peerInboxId'
  | 'groupName';

export interface ConversationSortOptions {
  sortBy: ConversationSortBy;
  ascending?: boolean;
}
