import type { WalletClient } from 'viem';
import { hexToBytes } from 'viem';
import type { EOASigner } from '@xmtp/browser-sdk';
import { IdentifierKind } from '@xmtp/browser-sdk';

/**
 * Creates an XMTP-compatible signer from a wagmi WalletClient
 *
 * @param walletClient - The wagmi WalletClient instance
 * @param address - The Ethereum address to sign with
 * @returns An XMTP EOA Signer
 */
export function createXmtpSigner(
  walletClient: WalletClient,
  address: string
): EOASigner {
  return {
    type: 'EOA',
    getIdentifier: () => ({
      // IMPORTANT: Must lowercase address to match xmtp.chat behavior
      // This ensures the same inboxId is generated and the correct OPFS database is loaded
      identifier: address.toLowerCase(),
      identifierKind: IdentifierKind.Ethereum,
    }),
    signMessage: async (message: string) => {
      const signature = await walletClient.signMessage({
        account: address as `0x${string}`,
        message,
      });
      return hexToBytes(signature);
    },
  };
}
