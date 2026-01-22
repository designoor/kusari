'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { FeatureItem } from '../FeatureItem';
import { useXmtp } from '@/hooks/useXmtp';
import { useWallet } from '@/hooks/useWallet';
import styles from './SignMessageStep.module.css';

export interface SignMessageStepProps {
  onComplete: () => void;
  onBack: () => void;
}

/**
 * Third and final step of the onboarding flow
 * Prompts users to sign a message to enable XMTP messaging
 */
export const SignMessageStep: React.FC<SignMessageStepProps> = ({
  onComplete,
  onBack,
}) => {
  const { initializeWithWallet, isInitializing, isInitialized, error } = useXmtp();
  const { isConnected } = useWallet();
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleEnableMessaging = async () => {
    if (!isConnected) {
      return;
    }

    setHasAttempted(true);

    try {
      await initializeWithWallet();
    } catch (err) {
      console.error('Failed to initialize XMTP:', err);
    }
  };

  const canProceed = isInitialized;
  const showError = hasAttempted && error && !isInitializing;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <Icon name="shield" size="xl" />
        </div>

        <h1 className={styles.title}>Enable Secure Messaging</h1>

        <p className={styles.description}>
          To send and receive messages, you need to sign a message with your wallet. This creates your secure messaging keys on the XMTP network.
        </p>

        {canProceed ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>
              <Icon name="check" size="md" />
            </div>
            <div>
              <p className={styles.successTitle}>Messaging Enabled</p>
              <p className={styles.successDescription}>
                You're all set! You can now send and receive encrypted messages.
              </p>
            </div>
          </div>
        ) : (
          <div className={styles.features}>
            <FeatureItem
              icon="shield"
              title="End-to-End Encrypted"
              description="Your messages are encrypted and only you and your recipients can read them"
            />
            <FeatureItem
              icon="wallet"
              title="One-Time Setup"
              description="You only need to sign once to create your messaging identity"
              color="#00D4FF"
            />
          </div>
        )}

        {showError && (
          <div className={styles.errorBox}>
            <Icon name="x" size="md" />
            <p className={styles.errorText}>
              {error?.message || 'Failed to enable messaging. Please try again.'}
            </p>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {canProceed ? (
          <Button variant="primary" size="lg" fullWidth onClick={onComplete}>
            Get Started
          </Button>
        ) : (
          <>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleEnableMessaging}
              loading={isInitializing}
              disabled={!isConnected}
            >
              {isInitializing ? 'Signing...' : 'Enable Secure Messaging'}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={onBack}
              disabled={isInitializing}
            >
              Back
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
