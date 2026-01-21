'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib';
import type { ConversationPreview } from '@/types/conversation';
import styles from './ConversationItem.module.css';

export interface ConversationItemProps {
  conversation: ConversationPreview;
  isActive?: boolean;
}

export const ConversationItem: React.FC<ConversationItemProps> = React.memo(({
  conversation,
  isActive = false,
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

  // Display name: group name or full peer Ethereum address
  // CSS will handle truncation with ellipsis if too long
  // Fall back to inbox ID if address is not available
  const displayName = isDm
    ? (peerAddress ?? peerInboxId ?? 'Unknown')
    : groupName ?? 'Unknown Group';

  // Message preview text
  const previewText = lastMessage?.content ?? 'No messages yet';

  // Time display
  const timeDisplay = lastMessage?.sentAt
    ? formatRelativeTime(lastMessage.sentAt)
    : '';

  const content = (
    <>
      <Avatar
        address={peerAddress ?? peerInboxId}
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
