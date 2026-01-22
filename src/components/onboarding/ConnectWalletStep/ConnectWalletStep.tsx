'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useWallet } from '@/hooks/useWallet';
import { truncateAddress } from '@/lib';
import styles from './ConnectWalletStep.module.css';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export interface ConnectWalletStepProps {
  onNext: () => void;
  onBack: () => void;
}

/**
 * Second step of the onboarding flow
 * Allows users to connect their wallet via WalletConnect
 */
export const ConnectWalletStep: React.FC<ConnectWalletStepProps> = ({
  onNext,
  onBack,
}) => {
  const { address, isConnected, isConnecting, connect, disconnectAsync } = useWallet();
  const isConfigured = Boolean(projectId);

  const handleChangeWallet = async () => {
    await disconnectAsync();
    connect();
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <Icon name="wallet" size="xl" />
        </div>

        <h1 className={styles.title}>Connect Your Wallet</h1>

        <p className={styles.description}>
          Connect your Ethereum wallet to get started with Kusari. We support browser wallets and mobile wallets via WalletConnect.
        </p>

        {!isConfigured && (
          <div className={styles.warningBox}>
            <Icon name="x" size="md" />
            <div>
              <p className={styles.warningTitle}>Configuration Required</p>
              <p className={styles.warningText}>
                Add NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to .env.local. Get one at{' '}
                <a href="https://cloud.walletconnect.com" target="_blank" rel="noopener noreferrer">
                  cloud.walletconnect.com
                </a>
              </p>
            </div>
          </div>
        )}

        {isConnected && address ? (
          <div className={styles.connectedState}>
            <div className={styles.connectedIcon}>
              <Icon name="check" size="md" />
            </div>
            <div>
              <p className={styles.connectedLabel}>Connected</p>
              <p className={styles.connectedAddress}>{truncateAddress(address)}</p>
            </div>
          </div>
        ) : isConfigured ? (
          <div className={styles.walletInfo}>
            <div className={styles.infoItem}>
              <Icon name="shield" size="md" />
              <span>Secure connection via WalletConnect v2</span>
            </div>
            <div className={styles.infoItem}>
              <Icon name="wallet" size="md" />
              <span>Supports MetaMask, Rainbow, and more</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.actions}>
        {!isConnected ? (
          <>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={connect}
              loading={isConnecting}
              disabled={!isConfigured}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={onBack}>
              Back
            </Button>
          </>
        ) : (
          <>
            <Button variant="primary" size="lg" fullWidth onClick={onNext}>
              Continue
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={handleChangeWallet}>
              Change Wallet
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
