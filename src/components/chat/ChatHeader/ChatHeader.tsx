'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { truncateAddress } from '@/lib';
import styles from './ChatHeader.module.css';

export interface ChatHeaderProps {
  peerInboxId?: string;
  groupName?: string;
  isDm?: boolean;
  showBackButton?: boolean;
  backHref?: string;
  onBackClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  peerInboxId,
  groupName,
  isDm = true,
  showBackButton = false,
  backHref = '/chat',
  onBackClick,
}) => {
  // Display name: group name or truncated inbox ID
  const displayName = isDm
    ? truncateAddress(peerInboxId ?? '', 6, 4)
    : groupName ?? 'Unknown Group';

  return (
    <header className={styles.header}>
      {showBackButton && (
        <Link
          href={backHref}
          className={styles.backButton}
          onClick={onBackClick}
          aria-label="Back to conversations"
        >
          <Icon name="chevron-left" size="md" />
        </Link>
      )}
      <Avatar
        address={peerInboxId}
        size="md"
        className={styles.avatar}
      />
      <div className={styles.info}>
        <h1 className={styles.name}>{displayName}</h1>
        {peerInboxId && (
          <p className={styles.address} title={peerInboxId}>
            {peerInboxId}
          </p>
        )}
      </div>
    </header>
  );
};
