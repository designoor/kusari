import { Client, LogLevel } from '@xmtp/browser-sdk';
import type { EOASigner } from '@xmtp/browser-sdk';
import type { XmtpClientConfig, XmtpEnv } from './types';

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
      ...(config.apiUrl && { apiUrl: config.apiUrl }),
    });

    return client;
  } catch (error) {
    console.error('Failed to create XMTP client:', error);
    throw new Error(
      `XMTP client creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
