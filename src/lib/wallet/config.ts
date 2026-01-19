import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { walletConnect, injected } from 'wagmi/connectors';

// Get WalletConnect project ID from environment
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

// Configure chains
export const chains = [mainnet, sepolia] as const;

// Create wagmi config
export const config = createConfig({
  chains,
  connectors: [
    injected(), // MetaMask, Coinbase Wallet, etc.
    ...(projectId
      ? [
          walletConnect({
            projectId,
            metadata: {
              name: 'Kusari',
              description: 'Web3 Messaging with XMTP',
              url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
              icons: ['https://avatars.githubusercontent.com/u/37784886'],
            },
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});
