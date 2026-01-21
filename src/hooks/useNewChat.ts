'use client';

import { useState, useCallback } from 'react';
import type { Dm } from '@xmtp/browser-sdk';
import { useXmtpContext } from '@/providers/XmtpProvider';
import { canMessageAddress, findOrCreateDmByAddress } from '@/services/xmtp/identity';
import { allowInboxes } from '@/services/xmtp/consent';

interface UseNewChatReturn {
  /**
   * Check if an address can receive XMTP messages
   * @param address Ethereum address to check
   * @returns true if address can receive messages
   */
  checkCanMessage: (address: string) => Promise<boolean>;

  /**
   * Create or find a conversation with an address
   * Auto-sets consent to allowed so conversation appears in chat list
   * @param address Ethereum address of recipient
   * @returns Conversation ID for navigation
   */
  createConversation: (address: string) => Promise<string>;

  /** True while checking if address can receive messages */
  isChecking: boolean;

  /** True while creating conversation */
  isCreating: boolean;
}

/**
 * Hook for creating new chat conversations
 *
 * Provides methods to:
 * - Check if an address can receive XMTP messages
 * - Create/find a DM conversation with auto-consent
 *
 * Error Handling:
 * Methods throw errors which should be caught by the caller.
 * This allows programmatic handling via try/catch when awaiting the promise.
 *
 * @returns Methods and state for new chat creation
 */
export function useNewChat(): UseNewChatReturn {
  const { client } = useXmtpContext();
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Check if an address can receive XMTP messages
   */
  const checkCanMessage = useCallback(
    async (address: string): Promise<boolean> => {
      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      setIsChecking(true);

      try {
        const canMessage = await canMessageAddress(client, address);
        return canMessage;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to check address');
      } finally {
        setIsChecking(false);
      }
    },
    [client]
  );

  /**
   * Create or find a conversation with an address
   * Automatically sets consent to allowed for the sender
   *
   * Note: If DM creation succeeds but consent setting fails,
   * the conversation ID is still returned so navigation can proceed.
   * The conversation may not appear in the chat list until consent is set.
   */
  const createConversation = useCallback(
    async (address: string): Promise<string> => {
      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      setIsCreating(true);

      try {
        // Create or find the DM conversation - this is the critical operation
        let dm: Dm;
        let peerInboxId: string;

        try {
          const result = await findOrCreateDmByAddress(client, address);
          dm = result.dm;
          peerInboxId = result.peerInboxId;
        } catch (err) {
          throw err instanceof Error ? err : new Error('Failed to create conversation');
        }

        // Auto-allow the contact so conversation appears in chat list
        // If this fails, we still return the conversation ID so user can navigate
        try {
          await allowInboxes(client, [peerInboxId]);
        } catch (err) {
          console.warn('Failed to set consent, conversation may not appear in chat list:', err);
        }

        return dm.id;
      } finally {
        setIsCreating(false);
      }
    },
    [client]
  );

  return {
    checkCanMessage,
    createConversation,
    isChecking,
    isCreating,
  };
}
