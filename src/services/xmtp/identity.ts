import { Client, IdentifierKind } from '@xmtp/browser-sdk';
import type { Dm, Identifier } from '@xmtp/browser-sdk';

import { isValidAddress } from '@/lib/address';
import { findOrCreateDm } from './conversations';

/**
 * Get the primary Ethereum address for an inbox ID
 *
 * Resolves an XMTP inbox ID to its primary Ethereum address by fetching
 * the inbox state from the network.
 *
 * @param client XMTP client instance
 * @param inboxId The XMTP inbox ID to resolve
 * @returns The primary Ethereum address for the inbox, or null if not found
 */
export async function getAddressForInboxId(
  client: Client,
  inboxId: string
): Promise<string | null> {
  try {
    const states = await client.preferences.getInboxStates([inboxId]);
    const state = states[0];

    if (!state) {
      return null;
    }

    // Find the first Ethereum identifier
    const ethIdentifier = state.accountIdentifiers.find(
      (id: Identifier) => id.identifierKind === IdentifierKind.Ethereum
    );

    return ethIdentifier?.identifier ?? null;
  } catch (error) {
    console.error('Failed to get address for inbox ID:', error);
    return null;
  }
}

/**
 * Get Ethereum addresses for multiple inbox IDs
 *
 * Batch resolves XMTP inbox IDs to their primary Ethereum addresses.
 * More efficient than calling getAddressForInboxId for each inbox.
 *
 * @param client XMTP client instance
 * @param inboxIds Array of XMTP inbox IDs to resolve
 * @returns Map of inbox ID to Ethereum address (null if not found)
 */
export async function getAddressesForInboxIds(
  client: Client,
  inboxIds: string[]
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();

  if (inboxIds.length === 0) {
    return result;
  }

  // Create a map of original inbox IDs for later lookup
  // This handles potential case differences between input and API response
  const originalInboxIdMap = new Map<string, string>();
  for (const inboxId of inboxIds) {
    originalInboxIdMap.set(inboxId.toLowerCase(), inboxId);
  }

  try {
    const states = await client.preferences.getInboxStates(inboxIds);

    for (const state of states) {
      // Find the first Ethereum identifier
      const ethIdentifier = state.accountIdentifiers.find(
        (id: Identifier) => id.identifierKind === IdentifierKind.Ethereum
      );

      // Use the ORIGINAL inbox ID as key (found via case-insensitive lookup)
      // This ensures consistency between what we pass in and what we get back
      const originalInboxId = originalInboxIdMap.get(state.inboxId.toLowerCase()) ?? state.inboxId;
      result.set(originalInboxId, ethIdentifier?.identifier ?? null);
    }

    // Fill in any missing inbox IDs with null
    for (const inboxId of inboxIds) {
      if (!result.has(inboxId)) {
        result.set(inboxId, null);
      }
    }

    return result;
  } catch (error) {
    console.error('Failed to get addresses for inbox IDs:', error);
    // Return null for all inbox IDs on error
    for (const inboxId of inboxIds) {
      result.set(inboxId, null);
    }
    return result;
  }
}

/**
 * Check if an Ethereum address can receive XMTP messages
 *
 * Uses the XMTP SDK's canMessage method to verify that an address
 * has registered with the XMTP network and can receive messages.
 *
 * @param client XMTP client instance
 * @param address Ethereum address to check (0x...)
 * @returns true if the address can receive XMTP messages
 * @throws Error if the address format is invalid or check fails due to network issues
 */
export async function canMessageAddress(
  client: Client,
  address: string
): Promise<boolean> {
  if (!isValidAddress(address)) {
    throw new Error('Invalid Ethereum address format');
  }

  try {
    const normalizedAddress = address.toLowerCase();
    const identifier: Identifier = {
      identifier: normalizedAddress,
      identifierKind: IdentifierKind.Ethereum,
    };

    const results = await client.canMessage([identifier]);

    // Results is a Map<string, boolean>
    return results.get(normalizedAddress) ?? false;
  } catch (error) {
    console.error('Failed to check if address can receive messages:', error);
    throw new Error('Failed to verify address on XMTP network');
  }
}

/**
 * Check if multiple Ethereum addresses can receive XMTP messages
 *
 * Batch version of canMessageAddress for checking multiple addresses at once.
 *
 * @param client XMTP client instance
 * @param addresses Array of Ethereum addresses to check
 * @returns Map of address to boolean (true if can receive messages)
 * @throws Error if any address format is invalid or check fails due to network issues
 */
export async function canMessageAddresses(
  client: Client,
  addresses: string[]
): Promise<Map<string, boolean>> {
  const invalidAddresses = addresses.filter((addr) => !isValidAddress(addr));
  if (invalidAddresses.length > 0) {
    throw new Error(
      `Invalid Ethereum address format: ${invalidAddresses[0]}`
    );
  }

  try {
    if (addresses.length === 0) {
      return new Map();
    }

    const identifiers: Identifier[] = addresses.map((address) => ({
      identifier: address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }));

    return await client.canMessage(identifiers);
  } catch (error) {
    console.error('Failed to check if addresses can receive messages:', error);
    throw new Error('Failed to verify addresses on XMTP network');
  }
}

/**
 * Get the inbox ID for an Ethereum address
 *
 * Resolves an Ethereum address to its corresponding XMTP inbox ID.
 * The address must be registered with XMTP for this to succeed.
 *
 * @param client XMTP client instance
 * @param address Ethereum address to resolve
 * @returns The inbox ID for the address
 * @throws Error if the address format is invalid, not registered with XMTP, or resolution fails
 */
export async function getInboxIdForAddress(
  client: Client,
  address: string
): Promise<string> {
  if (!isValidAddress(address)) {
    throw new Error('Invalid Ethereum address format');
  }

  const identifier: Identifier = {
    identifier: address.toLowerCase(),
    identifierKind: IdentifierKind.Ethereum,
  };

  let inboxId: string | undefined;
  try {
    inboxId = await client.fetchInboxIdByIdentifier(identifier);
  } catch (error) {
    console.error('Failed to get inbox ID for address:', error);
    throw new Error('Failed to resolve address to inbox ID');
  }

  if (!inboxId) {
    throw new Error('Address is not registered with XMTP');
  }

  return inboxId;
}

/**
 * Find or create a DM conversation with an Ethereum address
 *
 * This is a convenience function that:
 * 1. Resolves the Ethereum address to an XMTP inbox ID
 * 2. Validates the user is not trying to message themselves
 * 3. Finds an existing DM or creates a new one with that inbox ID
 *
 * @param client XMTP client instance
 * @param address Ethereum address of the recipient
 * @returns Object containing the DM conversation and peer's inbox ID
 * @throws Error if the address format is invalid, not on XMTP, is the user's own address, or conversation creation fails
 */
export async function findOrCreateDmByAddress(
  client: Client,
  address: string
): Promise<{ dm: Dm; peerInboxId: string }> {
  try {
    // Resolve the address to an inbox ID
    const peerInboxId = await getInboxIdForAddress(client, address);

    // Prevent self-messaging (defense-in-depth: UI also validates via address comparison,
    // but this check uses inbox ID comparison as a backend safety net)
    if (peerInboxId === client.inboxId) {
      throw new Error('You cannot message yourself');
    }

    // Use the shared findOrCreateDm function
    const dm = await findOrCreateDm(client, peerInboxId);

    return { dm, peerInboxId };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Address is not registered with XMTP' ||
        error.message === 'Invalid Ethereum address format' ||
        error.message === 'You cannot message yourself')
    ) {
      throw error;
    }
    console.error('Failed to find or create DM by address:', error);
    throw new Error(`Failed to start conversation with ${address}`);
  }
}

/**
 * Check if we already have a DM with an Ethereum address
 *
 * @param client XMTP client instance
 * @param address Ethereum address to check
 * @returns The existing DM conversation if found, null if address is not on XMTP or no DM exists
 * @throws Error if address format is invalid or network error occurs
 */
export async function findDmByAddress(
  client: Client,
  address: string
): Promise<Dm | null> {
  if (!isValidAddress(address)) {
    throw new Error('Invalid Ethereum address format');
  }

  try {
    const inboxId = await getInboxIdForAddress(client, address);
    const dm = await client.conversations.getDmByInboxId(inboxId);
    return dm ?? null;
  } catch (error) {
    // Address not registered with XMTP is expected - return null
    if (
      error instanceof Error &&
      error.message === 'Address is not registered with XMTP'
    ) {
      return null;
    }
    // Network errors and other failures should propagate
    console.error('Failed to find DM by address:', error);
    throw new Error('Failed to check for existing conversation');
  }
}
