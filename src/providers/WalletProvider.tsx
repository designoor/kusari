'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { config, projectId, wagmiAdapter, networks, metadata } from '@/lib/wallet/config';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Initialize AppKit (only once, outside component)
// Always call createAppKit to ensure hooks work during SSR/prerendering
createAppKit({
  adapters: [wagmiAdapter],
  projectId: projectId || '',
  networks,
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--apkt-accent': '#5BFF8C',
    '--apkt-color-mix': '#000000',
    '--apkt-color-mix-strength': 20,
    '--apkt-border-radius-master': '0px',
  },
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
  // Featured wallets shown at the top of the wallet picker
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom
    '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // OKX
    '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1', // Rabby
  ],
  // Disable Coinbase Wallet - incompatible with cross-origin isolation headers
  // required by XMTP SDK (COOP: same-origin breaks Coinbase Smart Wallet popups)
  enableCoinbase: false,
});

export interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};
