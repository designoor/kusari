'use client';

import React, { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ConsentState } from '@xmtp/browser-sdk';
import { Avatar } from '@/components/ui/Avatar';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { DropdownMenu, type DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { EthosReputationPanel } from '@/components/reputation/EthosReputationPanel';
import { ContactActions } from '../ContactActions';
import { useConsent } from '@/hooks/useConsent';
import { useEthosScore } from '@/hooks/useEthosScore';
import { ChatIcon, BanIcon, InboxIcon, AlertTriangleIcon } from '@/components/ui/Icon/icons';
import styles from './ContactDetail.module.css';

export interface ContactDetailProps {
  /** Ethereum address for display and Ethos lookup */
  address: string;
  /** XMTP inbox ID for consent operations */
  peerInboxId: string;
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
  peerInboxId,
  displayName,
  consentState,
  conversationId,
  lastMessage,
  onConsentChange,
  showChatButton = true,
  className,
}) => {
  const router = useRouter();
  const { denyContact, resetContact } = useConsent();
  const [isBlocking, setIsBlocking] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Fetch Ethos profile for the address
  const { data: ethosProfile } = useEthosScore(address);

  // Get Ethos username if available
  const ethosUsername = ethosProfile?.username || ethosProfile?.displayName;

  // Primary display: username if available, otherwise address
  const primaryName = displayName ?? (ethosUsername ?? address);

  // Calculate accept button variant based on Ethos score
  const acceptVariant: ButtonVariant = useMemo(() => {
    if (!ethosProfile) {
      return 'danger';
    }
    const score = ethosProfile.score;
    if (score < 1300) {
      return 'danger';
    }
    if (score <= 1500) {
      return 'secondary';
    }
    return 'primary';
  }, [ethosProfile]);

  const handleOpenChat = useCallback(() => {
    if (conversationId) {
      router.push(`/chat/${conversationId}`);
    }
  }, [conversationId, router]);

  // Use peerInboxId for consent operations (XMTP requires inbox ID, not Ethereum address)
  const inboxIdForConsent = peerInboxId;

  const handleBlock = useCallback(async () => {
    setIsBlocking(true);
    try {
      await denyContact(inboxIdForConsent);
      onConsentChange?.(ConsentState.Denied);
    } catch (err) {
      console.error('Failed to block contact:', err);
    } finally {
      setIsBlocking(false);
    }
  }, [inboxIdForConsent, denyContact, onConsentChange]);

  const handleMoveToRequests = useCallback(async () => {
    setIsResetting(true);
    try {
      await resetContact(inboxIdForConsent);
      onConsentChange?.(ConsentState.Unknown);
    } catch (err) {
      console.error('Failed to move contact to requests:', err);
    } finally {
      setIsResetting(false);
    }
  }, [inboxIdForConsent, resetContact, onConsentChange]);

  // Menu items for allowed contacts
  const moreMenuItems: DropdownMenuItem[] = useMemo(
    () => [
      {
        id: 'move-to-requests',
        label: isResetting ? 'Moving...' : 'Move to Requests',
        icon: <InboxIcon size={16} />,
        onClick: handleMoveToRequests,
        disabled: isResetting || isBlocking,
      },
      {
        id: 'block',
        label: isBlocking ? 'Blocking...' : 'Block Contact',
        icon: <BanIcon size={16} />,
        onClick: handleBlock,
        danger: true,
        disabled: isBlocking || isResetting,
      },
    ],
    [handleBlock, handleMoveToRequests, isBlocking, isResetting]
  );

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {/* Contact Header */}
      <div className={styles.header}>
        <Avatar src={ethosProfile?.avatarUrl} address={address} size="xl" />
        <div className={styles.headerInfo}>
          <h2 className={styles.name}>{primaryName}</h2>
          <p className={styles.address} title={address}>{address}</p>
        </div>
      </div>

      {/* Reputation Panel */}
      <div className={styles.section}>
        <SectionTitle>Reputation</SectionTitle>
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
          <SectionTitle>Message Preview</SectionTitle>
          <div className={styles.messagePreview}>
            <p className={styles.messageContent}>{lastMessage.content}</p>
          </div>
        </div>
      )}

      {/* System Message (warning for low/no reputation) */}
      {consentState === ConsentState.Unknown && acceptVariant === 'danger' && (
        <div className={styles.section}>
          <SectionTitle>System Message</SectionTitle>
          <div className={styles.systemMessage}>
            <AlertTriangleIcon size={20} className={styles.systemMessageIcon} />
            <p className={styles.systemMessageContent}>
              This account has no verified reputation or a very low trust score. Exercise caution before accepting this connection request.
            </p>
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
            <DropdownMenu variant="secondary" items={moreMenuItems} ariaLabel="Contact options" size="lg" />
          </div>
        )}

        {/* Unknown/Denied contacts: show ContactActions */}
        {consentState !== ConsentState.Allowed && (
          <ContactActions
            inboxId={inboxIdForConsent}
            consentState={consentState}
            onConsentChange={onConsentChange}
            layout="horizontal"
            size="lg"
            fullWidth
            acceptVariant={acceptVariant}
          />
        )}
      </div>
    </div>
  );
});

ContactDetail.displayName = 'ContactDetail';
