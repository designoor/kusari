'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { FeatureItem } from '../FeatureItem';
import { AsciiLogo } from '../AsciiLogo';
import { useWallet } from '@/hooks/useWallet';
import styles from './WelcomeStep.module.css';

/**
 * First step of the onboarding flow
 * Introduces users to Kusari and Web3 messaging
 *
 * "Get Started" triggers wallet connection directly.
 * Step automatically advances when wallet connects (via app state).
 */
export const WelcomeStep: React.FC = () => {
  const { connect, isConnecting } = useWallet();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <AsciiLogo />

        <p className={styles.description}>
          Decentralised crypto native messaging app. Connect with Web3 accounts securely and privately.
        </p>

        <div className={styles.features}>
          <FeatureItem
            icon="shield"
            title="Privacy-First"
            description="End-to-end encrypted messages via XMTP"
            color="#E93D82"
          />
          <FeatureItem
            icon="verified"
            title="Ethos Trust-Based System"
            description="Review sender reputation before accepting conversations"
            color="#F5A623"
          />
          <FeatureItem
            icon="chain"
            title="Web3 Native"
            description="Wallet-based identity, no email or password required"
            color="#00D4FF"
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={connect}
          loading={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Get Started'}
        </Button>
      </div>
    </div>
  );
};
