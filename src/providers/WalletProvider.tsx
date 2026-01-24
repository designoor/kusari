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
