import { defaultWagmiConfig } from '@web3modal/wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// Get WalletConnect project ID from environment
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.error(
    'CRITICAL: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. ' +
    'WalletConnect functionality will NOT work. ' +
    'Get a project ID at https://cloud.walletconnect.com'
  );
}

// Configure chains
export const chains = [mainnet, sepolia] as const;

// Metadata for WalletConnect
const metadata = {
  name: 'Kusari',
  description: 'Web3 Messaging with XMTP',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// Create wagmi config using Web3Modal's default config
// Note: projectId is required for WalletConnect. If missing, we use an empty string
// to satisfy the type system, but Web3Modal initialization will be skipped in WalletProvider.
export const config = defaultWagmiConfig({
  chains,
  projectId: projectId || '',
  metadata,
  enableCoinbase: true,
  enableInjected: true,
  enableWalletConnect: true,
});
