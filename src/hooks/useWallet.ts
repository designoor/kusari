'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export interface WalletState {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    // Get the first available connector (injected or WalletConnect)
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  return {
    address,
    isConnected,
    isConnecting: isPending,
    connect: handleConnect,
    disconnect,
  };
}
