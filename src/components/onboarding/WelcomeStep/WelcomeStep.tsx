import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { FeatureItem } from '../FeatureItem';
import styles from './WelcomeStep.module.css';

export interface WelcomeStepProps {
  onNext: () => void;
}

/**
 * First step of the onboarding flow
 * Introduces users to Kusari and Web3 messaging
 */
export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <Icon name="message" size="xl" />
        </div>

        <h1 className={styles.title}>Welcome to Kusari</h1>

        <p className={styles.description}>
          Your decentralized messaging app built on XMTP protocol. Connect with Web3 identities securely and privately.
        </p>

        <div className={styles.features}>
          <FeatureItem
            icon={<Icon name="shield" size="md" />}
            title="Privacy-First"
            description="End-to-end encrypted messages via XMTP"
          />
          <FeatureItem
            icon={<Icon name="verified" size="md" />}
            title="Trust-Based"
            description="Review sender reputation before accepting conversations"
            iconColor="#FFD700"
          />
          <FeatureItem
            icon={<Icon name="wallet" size="md" />}
            title="Web3 Native"
            description="Wallet-based identity, no email or password required"
            iconColor="#00D4FF"
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" size="lg" fullWidth onClick={onNext}>
          Get Started
        </Button>
      </div>
    </div>
  );
};
