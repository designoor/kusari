import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, sepolia, type AppKitNetwork } from '@reown/appkit/networks';

// Get WalletConnect project ID from environment
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error(
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. ' +
      'WalletConnect requires a project ID to function. ' +
      'Get one at https://cloud.reown.com'
  );
}

// Configure networks as a non-empty tuple (required by AppKit)
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, sepolia];

// Metadata for WalletConnect
export const metadata = {
  name: 'Kusari',
  description: 'Web3 Messaging with XMTP',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// Create Wagmi adapter for Reown AppKit
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true,
});

// Export wagmi config for use with WagmiProvider
export const config = wagmiAdapter.wagmiConfig;
