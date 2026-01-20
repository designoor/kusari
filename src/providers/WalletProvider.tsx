'use client';

import React, { useEffect, useRef } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { config, projectId } from '@/lib/wallet/config';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && projectId) {
      initialized.current = true;
      createWeb3Modal({
        wagmiConfig: config,
        projectId,
        themeMode: 'dark',
        themeVariables: {
          '--w3m-accent': '#5BFF8C',
          '--w3m-color-mix': '#000000',
          '--w3m-color-mix-strength': 40,
        },
      });
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};
