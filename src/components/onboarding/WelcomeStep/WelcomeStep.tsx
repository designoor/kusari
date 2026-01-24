'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { FeatureItem } from '../FeatureItem';
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
        <div className={styles.iconContainer}>
          <Icon name="message" size="xl" />
        </div>

        <h1 className={styles.title}>Welcome to Kusari</h1>

        <p className={styles.description}>
          Your decentralized messaging app. Connect with Web3 identities securely and privately.
        </p>

        <div className={styles.features}>
          <FeatureItem
            icon="shield"
            title="Privacy-First"
            description="End-to-end encrypted messages via XMTP"
          />
          <FeatureItem
            icon="verified"
            title="Ethos Trust-Based System"
            description="Review sender reputation before accepting conversations"
            color="#F5A623"
          />
          <FeatureItem
            icon="wallet"
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
