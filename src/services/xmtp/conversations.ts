import type { Client, Dm, Group } from '@xmtp/browser-sdk';
import type { Conversation } from '@/types/conversation';

/**
 * Type guard to check if a conversation is a DM
 *
 * This relies on the XMTP browser SDK's type structure where:
 * - Dm has a `peerInboxId()` method (returns the other participant's inbox ID)
 * - Group does NOT have this method
 *
 * SDK Contract: @xmtp/browser-sdk ^0.x
 * If this breaks after an SDK update, check the Dm/Group type definitions
 * in the SDK and update the discriminating property accordingly.
 *
 * @param conversation Conversation instance (Dm or Group)
 * @returns true if conversation is a Dm
 */
export function isDm(conversation: Conversation): conversation is Dm {
  return (
    'peerInboxId' in conversation &&
    typeof conversation.peerInboxId === 'function'
  );
}

/**
 * Type guard to check if a conversation is a Group
 *
 * This relies on the XMTP browser SDK's type structure where:
 * - Group has group management methods like `addMembers()`, `removeMembers()`
 * - Dm does NOT have these methods
 *
 * SDK Contract: @xmtp/browser-sdk ^0.x
 * If this breaks after an SDK update, check the Dm/Group type definitions
 * in the SDK and update the discriminating property accordingly.
 *
 * @param conversation Conversation instance (Dm or Group)
 * @returns true if conversation is a Group
 */
export function isGroup(conversation: Conversation): conversation is Group {
  return (
    'addMembers' in conversation &&
    typeof conversation.addMembers === 'function'
  );
}

/**
 * List all conversations (DMs and Groups) for the client
 * @param client XMTP client instance
 * @returns Array of conversations
 */
export async function listConversations(
  client: Client
): Promise<Conversation[]> {
  try {
    return await client.conversations.list();
  } catch (error) {
    console.error('Failed to list conversations:', error);
    throw new Error('Failed to list conversations');
  }
}

/**
 * List all DM conversations for the client
 * @param client XMTP client instance
 * @returns Array of DM conversations
 */
export async function listDms(client: Client): Promise<Dm[]> {
  try {
    return await client.conversations.listDms();
  } catch (error) {
    console.error('Failed to list DMs:', error);
    throw new Error('Failed to list DMs');
  }
}

/**
 * Find or create a 1:1 DM conversation with the specified inbox ID
 * @param client XMTP client instance
 * @param peerInboxId Inbox ID of the peer
 * @returns DM conversation instance
 */
export async function findOrCreateDm(
  client: Client,
  peerInboxId: string
): Promise<Dm> {
  try {
    // First try to find existing DM
    const existing = await client.conversations.getDmByInboxId(peerInboxId);

    if (existing) {
      return existing;
    }

    // If no existing DM, create new one
    return await client.conversations.createDm(peerInboxId);
  } catch (error) {
    console.error('Failed to find or create DM:', error);
    throw new Error(`Failed to find or create DM with ${peerInboxId}`);
  }
}

/**
 * Stream new conversations in real-time
 * @param client XMTP client instance
 * @param onConversation Callback function called for each new conversation
 * @returns Cleanup function to stop streaming
 */
export function streamConversations(
  client: Client,
  onConversation: (conversation: Conversation) => void
): () => void {
  let isStopped = false;
  let stream: Awaited<ReturnType<typeof client.conversations.stream>> | null = null;

  (async () => {
    try {
      stream = await client.conversations.stream();

      for await (const conversation of stream) {
        if (isStopped) break;
        onConversation(conversation);
      }
    } catch (error) {
      if (!isStopped) {
        console.error('Conversation stream error:', error);
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
 * Stream new DM conversations in real-time
 * @param client XMTP client instance
 * @param onDm Callback function called for each new DM
 * @returns Cleanup function to stop streaming
 */
export function streamDms(
  client: Client,
  onDm: (dm: Dm) => void
): () => void {
  let isStopped = false;
  let stream: Awaited<ReturnType<typeof client.conversations.streamDms>> | null = null;

  (async () => {
    try {
      stream = await client.conversations.streamDms();

      for await (const dm of stream) {
        if (isStopped) break;
        onDm(dm);
      }
    } catch (error) {
      if (!isStopped) {
        console.error('DM stream error:', error);
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
 * Get a conversation by its ID
 * @param client XMTP client instance
 * @param conversationId Conversation ID
 * @returns Conversation instance or null if not found
 * @throws Error if conversation cannot be retrieved (network error, etc.)
 */
export async function getConversationById(
  client: Client,
  conversationId: string
): Promise<Conversation | null> {
  try {
    const conversation = await client.conversations.getConversationById(
      conversationId
    );
    return conversation || null;
  } catch (error) {
    console.error('Failed to get conversation by ID:', error);
    throw new Error('Failed to get conversation by ID');
  }
}

/**
 * Check if a DM exists with the specified peer inbox ID
 * @param client XMTP client instance
 * @param peerInboxId Inbox ID of the peer
 * @returns true if DM exists, false otherwise
 * @throws Error if DM existence cannot be checked (network error, etc.)
 */
export async function hasDm(
  client: Client,
  peerInboxId: string
): Promise<boolean> {
  try {
    const dm = await client.conversations.getDmByInboxId(peerInboxId);
    return dm != null;
  } catch (error) {
    console.error('Failed to check DM existence:', error);
    throw new Error('Failed to check DM existence');
  }
}

/**
 * Sync conversations from the network
 * @param client XMTP client instance
 */
export async function syncConversations(client: Client): Promise<void> {
  try {
    await client.conversations.sync();
  } catch (error) {
    console.error('Failed to sync conversations:', error);
    throw new Error('Failed to sync conversations');
  }
}
