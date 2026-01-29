import {
  Client,
  Consent,
  ConsentEntityType,
  ConsentState,
} from '@xmtp/browser-sdk';

/**
 * Set consent state for inbox IDs
 * @param client XMTP client instance
 * @param inboxIds Array of inbox IDs
 * @param state Consent state to set
 */
export async function setInboxConsent(
  client: Client,
  inboxIds: string[],
  state: ConsentState
): Promise<void> {
  try {
    if (inboxIds.length === 0) return;

    const records: Consent[] = inboxIds.map((inboxId) => ({
      entityType: ConsentEntityType.InboxId,
      entity: inboxId,
      state,
    }));

    await client.preferences.setConsentStates(records);

    // Ensure consent state is published to the network for cross-device sync
    await client.preferences.sync();
  } catch (error) {
    console.error('Failed to set inbox consent:', error);
    throw new Error('Failed to set inbox consent');
  }
}

/**
 * Allow (accept) contacts by inbox ID
 * @param client XMTP client instance
 * @param inboxIds Array of inbox IDs to allow
 */
export async function allowInboxes(
  client: Client,
  inboxIds: string[]
): Promise<void> {
  await setInboxConsent(client, inboxIds, ConsentState.Allowed);
}

/**
 * Deny (block) contacts by inbox ID
 * @param client XMTP client instance
 * @param inboxIds Array of inbox IDs to deny
 */
export async function denyInboxes(
  client: Client,
  inboxIds: string[]
): Promise<void> {
  await setInboxConsent(client, inboxIds, ConsentState.Denied);
}

/**
 * Get consent state for an inbox ID
 * @param client XMTP client instance
 * @param inboxId Inbox ID to check
 * @returns Consent state
 * @throws Error if consent state cannot be retrieved
 */
export async function getInboxConsentState(
  client: Client,
  inboxId: string
): Promise<ConsentState> {
  try {
    return await client.preferences.getConsentState(
      ConsentEntityType.InboxId,
      inboxId
    );
  } catch (error) {
    console.error('Failed to get inbox consent state:', error);
    throw new Error('Failed to get inbox consent state');
  }
}

/**
 * Set consent state for a conversation (group)
 * @param client XMTP client instance
 * @param conversationId Conversation ID (group ID)
 * @param state Consent state to set
 */
export async function setConversationConsent(
  client: Client,
  conversationId: string,
  state: ConsentState
): Promise<void> {
  try {
    const records: Consent[] = [
      {
        entityType: ConsentEntityType.GroupId,
        entity: conversationId,
        state,
      },
    ];

    await client.preferences.setConsentStates(records);
  } catch (error) {
    console.error('Failed to set conversation consent:', error);
    throw new Error('Failed to set conversation consent');
  }
}

/**
 * Get consent state for a conversation (group)
 * @param client XMTP client instance
 * @param conversationId Conversation ID (group ID) to check
 * @returns Consent state
 * @throws Error if consent state cannot be retrieved
 */
export async function getConversationConsentState(
  client: Client,
  conversationId: string
): Promise<ConsentState> {
  try {
    return await client.preferences.getConsentState(
      ConsentEntityType.GroupId,
      conversationId
    );
  } catch (error) {
    console.error('Failed to get conversation consent state:', error);
    throw new Error('Failed to get conversation consent state');
  }
}

/**
 * Stream consent updates in real-time
 * @param client XMTP client instance
 * @param onUpdate Callback function called when consent state changes
 * @returns Cleanup function to stop streaming
 */
export function streamConsent(
  client: Client,
  onUpdate: (updates: Consent[]) => void
): () => void {
  let isStopped = false;
  let stream: Awaited<ReturnType<typeof client.preferences.streamConsent>> | null = null;

  (async () => {
    try {
      stream = await client.preferences.streamConsent();

      for await (const consentUpdates of stream) {
        if (isStopped) break;
        onUpdate(consentUpdates);
      }
    } catch (error) {
      if (!isStopped) {
        console.error('Consent stream error:', error);
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
 * Sync preferences from the network
 * @param client XMTP client instance
 */
export async function syncPreferences(client: Client): Promise<void> {
  try {
    await client.preferences.sync();
  } catch (error) {
    console.error('Failed to sync preferences:', error);
    throw new Error('Failed to sync preferences');
  }
}
