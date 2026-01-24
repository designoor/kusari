import { useCallback } from 'react';
import { useWalletClient } from 'wagmi';
import { useAppKitAccount } from '@reown/appkit/react';
import { useXmtpContext } from '@/providers/XmtpProvider';
import { createXmtpSigner } from '@/services/xmtp';

/**
 * Hook to access and manage XMTP client state
 *
 * @returns XMTP context value with additional helper methods
 */
export function useXmtp() {
  const context = useXmtpContext();
  const { initialize } = context;
  const { data: walletClient } = useWalletClient();
  const { address } = useAppKitAccount();

  /**
   * Initialize XMTP client with the connected wallet
   * Automatically creates the signer from the current wallet connection
   */
  const initializeWithWallet = useCallback(async () => {
    if (!walletClient || !address) {
      throw new Error('Wallet not connected');
    }

    // Create XMTP signer from wagmi wallet client
    const signer = createXmtpSigner(walletClient, address);

    // Initialize XMTP client
    await initialize(signer);
  }, [walletClient, address, initialize]);

  return {
    ...context,
    initializeWithWallet,
  };
}
