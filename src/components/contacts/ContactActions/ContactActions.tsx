'use client';

import React, { useState, useCallback } from 'react';
import { ConsentState } from '@xmtp/browser-sdk';
import { Button } from '@/components/ui/Button';
import { CheckIcon, XIcon, BanIcon, UserCheckIcon } from '@/components/ui/Icon/icons';
import { useConsent } from '@/hooks/useConsent';
import styles from './ContactActions.module.css';

/**
 * Exhaustive type check helper - ensures all enum cases are handled.
 * TypeScript will error at compile time if a case is missing.
 * Throws at runtime if an unexpected value is encountered.
 */
function assertNever(value: never): never {
  throw new Error(`Unhandled consent state: ${value}`);
}

export interface ContactActionsProps {
  /** Inbox ID of the contact */
  inboxId: string;
  /** Current consent state */
  consentState: ConsentState;
  /** Callback when consent state changes */
  onConsentChange?: (newState: ConsentState) => void;
  /** Layout direction */
  layout?: 'horizontal' | 'vertical';
  /** Size of buttons */
  size?: 'sm' | 'md' | 'lg';
  /** Show full-width buttons */
  fullWidth?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * ContactActions displays action buttons based on consent state.
 *
 * States and actions:
 * - Unknown: Accept | Decline
 * - Allowed: Block Contact
 * - Denied: Unblock Contact
 */
export const ContactActions: React.FC<ContactActionsProps> = ({
  inboxId,
  consentState,
  onConsentChange,
  layout = 'horizontal',
  size = 'md',
  fullWidth = false,
  className,
}) => {
  const { allowContact, denyContact, isLoading } = useConsent();
  const [actionInProgress, setActionInProgress] = useState<'allow' | 'deny' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAllow = useCallback(async () => {
    setActionInProgress('allow');
    setError(null);
    try {
      await allowContact(inboxId);
      onConsentChange?.(ConsentState.Allowed);
    } catch (err) {
      console.error('Failed to allow contact:', err);
      setError('Failed to accept contact. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, [inboxId, allowContact, onConsentChange]);

  const handleDeny = useCallback(async () => {
    setActionInProgress('deny');
    setError(null);
    try {
      await denyContact(inboxId);
      onConsentChange?.(ConsentState.Denied);
    } catch (err) {
      console.error('Failed to deny contact:', err);
      setError('Failed to update contact. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, [inboxId, denyContact, onConsentChange]);

  const isProcessing = isLoading || actionInProgress !== null;

  // Unknown state: Accept | Decline
  if (consentState === ConsentState.Unknown) {
    return (
      <div className={`${styles.wrapper} ${className ?? ''}`}>
        <div className={`${styles.container} ${styles[layout]}`}>
          <Button
            variant="primary"
            size={size}
            fullWidth={fullWidth}
            leftIcon={<CheckIcon size={16} />}
            onClick={handleAllow}
            loading={actionInProgress === 'allow'}
            disabled={isProcessing && actionInProgress !== 'allow'}
          >
            Accept
          </Button>
          <Button
            variant="ghost"
            size={size}
            fullWidth={fullWidth}
            leftIcon={<XIcon size={16} />}
            onClick={handleDeny}
            loading={actionInProgress === 'deny'}
            disabled={isProcessing && actionInProgress !== 'deny'}
          >
            Decline
          </Button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  // Allowed state: Block Contact
  if (consentState === ConsentState.Allowed) {
    return (
      <div className={`${styles.wrapper} ${className ?? ''}`}>
        <div className={`${styles.container} ${styles[layout]}`}>
          <Button
            variant="ghost"
            size={size}
            fullWidth={fullWidth}
            leftIcon={<BanIcon size={16} />}
            onClick={handleDeny}
            loading={actionInProgress === 'deny'}
            disabled={isProcessing}
          >
            Block Contact
          </Button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  // Denied state: Unblock Contact
  if (consentState === ConsentState.Denied) {
    return (
      <div className={`${styles.wrapper} ${className ?? ''}`}>
        <div className={`${styles.container} ${styles[layout]}`}>
          <Button
            variant="primary"
            size={size}
            fullWidth={fullWidth}
            leftIcon={<UserCheckIcon size={16} />}
            onClick={handleAllow}
            loading={actionInProgress === 'allow'}
            disabled={isProcessing}
          >
            Unblock Contact
          </Button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  // Exhaustive check - TypeScript will error if a ConsentState case is not handled above
  return assertNever(consentState);
};
