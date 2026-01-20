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
if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
    metadata,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#5BFF8C',
      '--w3m-color-mix': '#000000',
      '--w3m-color-mix-strength': 40,
    },
    features: {
      analytics: false,
    },
  });
}

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
