import { Client, IdentifierKind, LogLevel } from '@xmtp/browser-sdk';
import type { EOASigner, Identifier } from '@xmtp/browser-sdk';
import type { XmtpClientConfig, XmtpEnv } from './types';

// Storage key for persisting XMTP session info
const XMTP_SESSION_KEY = 'xmtp_session';

// Key to track if we've already tried clearing OPFS to avoid infinite loops
const OPFS_CLEARED_KEY = 'xmtp_opfs_cleared';

/**
 * Clear the XMTP OPFS database.
 * This is a nuclear option when the database is in an unrecoverable state.
 * The user will need to re-sign to create a new installation.
 */
export async function clearXmtpDatabase(): Promise<boolean> {
  try {
    // Check if OPFS is available
    if (!navigator.storage || !('getDirectory' in navigator.storage)) {
      return false;
    }

    const root = await navigator.storage.getDirectory();

    // XMTP SDK stores data in .opfs-libxmtp-metadata directory
    // We need to delete this recursively
    const xmtpDirs = ['.opfs-libxmtp-metadata'];

    for (const dirName of xmtpDirs) {
      try {
        await root.removeEntry(dirName, { recursive: true });
      } catch (e) {
        // Directory might not exist, that's OK
        if (e instanceof Error && e.name !== 'NotFoundError') {
          // Non-NotFoundError failures are logged for debugging but don't fail the operation
          console.warn('Failed to delete XMTP OPFS directory:', e);
        }
      }
    }

    // Also clear the session
    clearXmtpSession();

    return true;
  } catch {
    return false;
  }
}

/**
 * Mark that we've cleared OPFS for this session to avoid infinite retry loops
 */
export function markOpfsCleared(): void {
  try {
    sessionStorage.setItem(OPFS_CLEARED_KEY, 'true');
  } catch {
    // Ignore
  }
}

/**
 * Check if we've already cleared OPFS in this session
 */
export function hasOpfsBeenCleared(): boolean {
  try {
    return sessionStorage.getItem(OPFS_CLEARED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Clear the OPFS cleared flag (call after successful client creation)
 */
export function clearOpfsClearedFlag(): void {
  try {
    sessionStorage.removeItem(OPFS_CLEARED_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Gets the XMTP environment from environment variables
 *
 * @returns The configured XMTP environment
 */
function getXmtpEnv(): XmtpEnv {
  const env = process.env.NEXT_PUBLIC_XMTP_ENV;

  if (env === 'production' || env === 'dev' || env === 'local') {
    return env;
  }

  // Default to local for development
  return 'local';
}

/**
 * Gets the XMTP client configuration from environment variables
 *
 * @returns The client configuration object
 */
function getClientConfig(): XmtpClientConfig {
  const env = getXmtpEnv();
  const apiUrl = process.env.NEXT_PUBLIC_XMTP_API_URL;

  return {
    env,
    ...(apiUrl && { apiUrl }),
  };
}

/**
 * Session info stored in localStorage for client resumption
 */
interface XmtpSession {
  address: string;
  inboxId: string;
  env: XmtpEnv;
}

/**
 * Save XMTP session info to localStorage for resumption on page refresh
 */
export function saveXmtpSession(address: string, inboxId: string): void {
  const config = getClientConfig();
  const normalizedAddress = address.toLowerCase();
  const session: XmtpSession = { address: normalizedAddress, inboxId, env: config.env };
  try {
    localStorage.setItem(XMTP_SESSION_KEY, JSON.stringify(session));
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

/**
 * Get stored XMTP session info if it exists and matches current environment
 */
export function getXmtpSession(address: string): XmtpSession | null {
  try {
    const stored = localStorage.getItem(XMTP_SESSION_KEY);
    if (!stored) return null;

    const session: XmtpSession = JSON.parse(stored);
    const config = getClientConfig();

    // Only return session if address and environment match
    if (session.address.toLowerCase() === address.toLowerCase() && session.env === config.env) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear stored XMTP session
 */
export function clearXmtpSession(): void {
  try {
    localStorage.removeItem(XMTP_SESSION_KEY);
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

/**
 * Build/resume an existing XMTP client from local database (no signature needed)
 *
 * @param address - The wallet address to build client for
 * @returns A promise that resolves to the XMTP client, or null if build fails
 */
export async function buildXmtpClient(address: string): Promise<Client | null> {
  const config = getClientConfig();
  const session = getXmtpSession(address);

  if (!session) {
    return null;
  }

  try {
    // IMPORTANT: Must lowercase address to match xmtp.chat behavior
    // This ensures the same inboxId is generated and the correct OPFS database is loaded
    const normalizedAddress = address.toLowerCase();
    const identifier: Identifier = {
      identifier: normalizedAddress,
      identifierKind: IdentifierKind.Ethereum,
    };

    const client = await Client.build(identifier, {
      env: config.env,
      loggingLevel: LogLevel.Off,
      ...(config.apiUrl && { apiUrl: config.apiUrl }),
    });

    // Use async isRegistered() method to verify with the network
    // The sync property getter may not be reliable after Client.build()
    const isRegistered = await client.isRegistered();

    if (!isRegistered) {
      // Client not registered with network, cannot use without signature
      // Close the client to release OPFS handles before returning
      try {
        client.close();
      } catch {
        // Ignore close errors
      }
      clearXmtpSession();
      return null;
    }

    // Verify the client can actually perform operations by doing a test sync
    // This catches cases where the OPFS database is in an inconsistent state
    try {
      await client.conversations.sync();
      // Clear the OPFS cleared flag on success
      clearOpfsClearedFlag();
      return client;
    } catch (verifyError) {
      // Check if this is an identity/registration error indicating corrupted OPFS.
      // The XMTP SDK does not export typed error classes for identity errors -
      // they come from the WASM bindings as generic Error objects with message strings.
      // Known patterns: "identity not found", "not registered", "identity does not exist"
      const isIdentityError =
        verifyError instanceof Error &&
        (verifyError.message.toLowerCase().includes('identity') ||
          verifyError.message.toLowerCase().includes('register'));

      if (isIdentityError) {
        // Close the broken client
        try {
          client.close();
        } catch {
          // Ignore close errors
        }

        // Clear session and OPFS if we haven't already tried in this session
        clearXmtpSession();

        if (!hasOpfsBeenCleared()) {
          const cleared = await clearXmtpDatabase();
          if (cleared) {
            markOpfsCleared();
          }
        }

        return null;
      }

      // For other errors (network issues), still return the client
      // as it may work offline
      return client;
    }
  } catch {
    // Clear invalid session
    clearXmtpSession();
    return null;
  }
}

/**
 * Creates and initializes an XMTP client
 *
 * @param signer - The XMTP-compatible signer
 * @returns A promise that resolves to the initialized XMTP client
 * @throws Error if client creation fails
 */
export async function createXmtpClient(signer: EOASigner): Promise<Client> {
  const config = getClientConfig();

  try {
    const client = await Client.create(signer, {
      env: config.env,
      loggingLevel: LogLevel.Off,
      appVersion: 'kusari/1.0.0',
      ...(config.apiUrl && { apiUrl: config.apiUrl }),
    });

    // Save session for future resumption
    const identifier = await Promise.resolve(signer.getIdentifier());
    if (identifier.identifier && client.inboxId) {
      saveXmtpSession(identifier.identifier, client.inboxId);
    }

    // Clear the OPFS cleared flag on successful creation
    clearOpfsClearedFlag();

    return client;
  } catch (error) {
    // Rethrow the original error to preserve the message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('XMTP client creation failed: Unknown error');
  }
}
