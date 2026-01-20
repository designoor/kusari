import type { ConsentState } from '@xmtp/browser-sdk';

export type { ConsentState };

/**
 * Consent action types
 */
export type ConsentAction = 'allow' | 'deny';

/**
 * Grouped contacts by consent state
 */
export interface GroupedContacts {
  allowed: string[];
  denied: string[];
  unknown: string[];
}

/**
 * Consent update event
 */
export interface ConsentUpdate {
  inboxId: string;
  state: ConsentState;
  timestamp: Date;
}
