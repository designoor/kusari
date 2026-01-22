import React from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
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
          <div className={styles.feature}>
            <Icon name="shield" size="md" />
            <div>
              <h3 className={styles.featureTitle}>Privacy-First</h3>
              <p className={styles.featureDescription}>
                End-to-end encrypted messages via XMTP
              </p>
            </div>
          </div>

          <div className={styles.feature}>
            <Icon name="verified" size="md" />
            <div>
              <h3 className={styles.featureTitle}>Trust-Based</h3>
              <p className={styles.featureDescription}>
                Review sender reputation before accepting conversations
              </p>
            </div>
          </div>

          <div className={styles.feature}>
            <Icon name="wallet" size="md" />
            <div>
              <h3 className={styles.featureTitle}>Web3 Native</h3>
              <p className={styles.featureDescription}>
                Wallet-based identity, no email or password required
              </p>
            </div>
          </div>
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
