'use client';

import { useAccount, useDisconnect } from 'wagmi';
import { useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react';

export interface WalletState {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  disconnectAsync: () => Promise<void>;
}

export function useWallet(): WalletState {
  const { address, isConnected, isConnecting: isAccountConnecting } = useAccount();
  const { disconnect, disconnectAsync } = useDisconnect();
  const { open } = useWeb3Modal();
  const { open: isModalOpen } = useWeb3ModalState();

  const handleConnect = () => {
    open();
  };

  // Consider connecting if either the modal is open or account is connecting
  const isConnecting = isModalOpen || isAccountConnecting;

  return {
    address,
    isConnected,
    isConnecting,
    connect: handleConnect,
    disconnect,
    disconnectAsync,
  };
}
