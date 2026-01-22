'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useEthosScore, usePreferences } from '@/hooks';
import { formatRelativeTime } from '@/lib';
import type { ConversationPreview } from '@/types/conversation';
import type { EthosProfile } from '@/services/ethos';
import styles from './ConversationItem.module.css';

export interface ConversationItemProps {
  conversation: ConversationPreview;
  isActive?: boolean;
  /** Pre-fetched Ethos profile (for batch optimization) */
  ethosProfile?: EthosProfile | null;
}

export const ConversationItem: React.FC<ConversationItemProps> = React.memo(({
  conversation,
  isActive = false,
  ethosProfile: externalEthosProfile,
}) => {
  const {
    id,
    peerInboxId,
    peerAddress,
    groupName,
    lastMessage,
    unreadCount,
    isDm,
  } = conversation;

  // Fetch Ethos profile for avatar (only for DMs, and only if not provided externally)
  const addressForEthos = isDm && !externalEthosProfile ? (peerAddress ?? peerInboxId) : undefined;
  const { data: fetchedEthosProfile } = useEthosScore(addressForEthos ?? null);
  const ethosProfile = externalEthosProfile ?? fetchedEthosProfile;

  // Get user preferences for hiding message previews
  // Use isLoading to prevent hydration flash - default to hidden for privacy during load
  const { hideMessagePreviews, isLoading: preferencesLoading } = usePreferences();

  // Display name: group name or full peer Ethereum address
  // CSS will handle truncation with ellipsis if too long
  // Fall back to inbox ID if address is not available
  const displayName = isDm
    ? (peerAddress ?? peerInboxId ?? 'Unknown')
    : groupName ?? 'Unknown Group';

  // Message preview text (hidden if user preference is enabled)
  // Default to hidden during loading to prevent flash of message content
  const shouldHidePreview = preferencesLoading || hideMessagePreviews;
  const previewText = lastMessage
    ? (shouldHidePreview ? 'Message hidden' : lastMessage.content)
    : 'No messages yet';

  // Time display
  const timeDisplay = lastMessage?.sentAt
    ? formatRelativeTime(lastMessage.sentAt)
    : '';

  const content = (
    <>
      <Avatar
        address={peerAddress ?? peerInboxId}
        src={ethosProfile?.avatarUrl}
        size="md"
        className={styles.avatar}
      />
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.name}>{displayName}</span>
          {timeDisplay && (
            <span className={styles.time}>{timeDisplay}</span>
          )}
        </div>
        <div className={styles.preview}>
          <span className={styles.message}>{previewText}</span>
          {unreadCount > 0 && (
            <Badge variant="accent" size="sm" count={unreadCount} className={styles.badge} />
          )}
        </div>
      </div>
    </>
  );

  // Render as link for navigation
  return (
    <Link
      href={`/chat/${id}`}
      className={`${styles.item} ${isActive ? styles.active : ''} ${unreadCount > 0 ? styles.unread : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {content}
    </Link>
  );
});

ConversationItem.displayName = 'ConversationItem';
