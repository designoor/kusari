'use client';

import { useState, useCallback } from 'react';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';

export interface WalletState {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  disconnectAsync: () => Promise<void>;
}

export function useWallet(): WalletState {
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConnect = useCallback(() => {
    setIsModalOpen(true);
    open();
  }, [open]);

  const handleDisconnect = useCallback(() => {
    setIsModalOpen(false);
    disconnect();
  }, [disconnect]);

  const handleDisconnectAsync = useCallback(async () => {
    setIsModalOpen(false);
    await disconnect();
  }, [disconnect]);

  // Only show connecting state if user initiated connection in this session
  // This prevents stale wagmi state from showing perpetual loading
  const isConnecting = isModalOpen && !isConnected;

  return {
    address,
    isConnected,
    isConnecting,
    connect: handleConnect,
    disconnect: handleDisconnect,
    disconnectAsync: handleDisconnectAsync,
  };
}
