'use client';

import { useState, useCallback } from 'react';
import { useAppKit, useDisconnect } from '@reown/appkit/react';
import { useWalletConnection } from './useWalletConnection';

export interface WalletState {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  disconnectAsync: () => Promise<void>;
}

export function useWallet(): WalletState {
  const { address, isConnected, isLoading } = useWalletConnection();
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

  // Show connecting state if:
  // - User initiated connection (modal open but not connected), OR
  // - Wallet is loading (initializing, reconnecting, connecting)
  const isConnecting = (isModalOpen && !isConnected) || isLoading;

  return {
    address,
    isConnected,
    isConnecting,
    connect: handleConnect,
    disconnect: handleDisconnect,
    disconnectAsync: handleDisconnectAsync,
  };
}
