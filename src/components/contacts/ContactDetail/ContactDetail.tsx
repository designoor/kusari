'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ConsentState } from '@xmtp/browser-sdk';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, type DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { EthosReputationPanel } from '@/components/reputation/EthosReputationPanel';
import { ContactActions } from '../ContactActions';
import { useConsent } from '@/hooks/useConsent';
import { truncateAddress } from '@/lib';
import { ChatIcon, BanIcon } from '@/components/ui/Icon/icons';
import styles from './ContactDetail.module.css';

export interface ContactDetailProps {
  /** Peer inbox ID / address */
  address: string;
  /** Optional display name or ENS name */
  displayName?: string;
  /** Current consent state */
  consentState: ConsentState;
  /** Optional conversation ID */
  conversationId?: string;
  /** Optional last message preview */
  lastMessage?: {
    content: string;
    sentAt: Date;
  };
  /** Callback when consent state changes */
  onConsentChange?: (newState: ConsentState) => void;
  /** Whether to show the "Open Chat" button (only for allowed contacts) */
  showChatButton?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * ContactDetail displays full contact information including:
 * - Avatar and name
 * - Ethos reputation panel
 * - Message preview (for requests)
 * - Action buttons
 */
export const ContactDetail: React.FC<ContactDetailProps> = React.memo(({
  address,
  displayName,
  consentState,
  conversationId,
  lastMessage,
  onConsentChange,
  showChatButton = true,
  className,
}) => {
  const router = useRouter();
  const { denyContact } = useConsent();
  const [isBlocking, setIsBlocking] = useState(false);
  const name = displayName ?? truncateAddress(address, 6, 4);

  const handleOpenChat = useCallback(() => {
    if (conversationId) {
      router.push(`/chat/${conversationId}`);
    }
  }, [conversationId, router]);

  const handleBlock = useCallback(async () => {
    setIsBlocking(true);
    try {
      await denyContact(address);
      onConsentChange?.(ConsentState.Denied);
    } catch (err) {
      console.error('Failed to block contact:', err);
    } finally {
      setIsBlocking(false);
    }
  }, [address, denyContact, onConsentChange]);

  // Menu items for allowed contacts
  const moreMenuItems: DropdownMenuItem[] = useMemo(
    () => [
      {
        id: 'block',
        label: isBlocking ? 'Blocking...' : 'Block Contact',
        icon: <BanIcon size={16} />,
        onClick: handleBlock,
        danger: true,
        disabled: isBlocking,
      },
    ],
    [handleBlock, isBlocking]
  );

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {/* Contact Header */}
      <div className={styles.header}>
        <Avatar address={address} size="xl" />
        <div className={styles.headerInfo}>
          <h2 className={styles.name}>{name}</h2>
          <p className={styles.address}>{truncateAddress(address, 8, 6)}</p>
        </div>
      </div>

      {/* Reputation Panel */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Reputation</h3>
        <EthosReputationPanel
          address={address}
          showUserInfo={false}
          showReviews={true}
          showVouches={true}
          showProfileLink={true}
        />
      </div>

      {/* Message Preview (for requests) */}
      {consentState === ConsentState.Unknown && lastMessage && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Message Preview</h3>
          <div className={styles.messagePreview}>
            <p className={styles.messageContent}>{lastMessage.content}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {/* Allowed contacts: Open Chat + dropdown menu for block */}
        {consentState === ConsentState.Allowed && (
          <div className={styles.allowedActions}>
            {showChatButton && conversationId && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<ChatIcon size={18} />}
                onClick={handleOpenChat}
              >
                Open Chat
              </Button>
            )}
            <DropdownMenu items={moreMenuItems} ariaLabel="Contact options" />
          </div>
        )}

        {/* Unknown/Denied contacts: show ContactActions */}
        {consentState !== ConsentState.Allowed && (
          <ContactActions
            inboxId={address}
            consentState={consentState}
            onConsentChange={onConsentChange}
            layout="horizontal"
            size="lg"
            fullWidth
          />
        )}
      </div>
    </div>
  );
});

ContactDetail.displayName = 'ContactDetail';
