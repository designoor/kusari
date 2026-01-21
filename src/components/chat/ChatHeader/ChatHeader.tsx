'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { truncateAddress } from '@/lib';
import styles from './ChatHeader.module.css';

export interface ChatHeaderProps {
  peerInboxId?: string;
  groupName?: string;
  isDm?: boolean;
  showBackButton?: boolean;
  backHref?: string;
  onBackClick?: () => void;
  /** Show loading skeleton state */
  isLoading?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  peerInboxId,
  groupName,
  isDm = true,
  showBackButton = false,
  backHref = '/chat',
  onBackClick,
  isLoading = false,
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
      {isLoading ? (
        <>
          <Skeleton variant="circular" width={40} height={40} />
          <div className={styles.info}>
            <Skeleton variant="text" width={120} height={18} />
            <Skeleton variant="text" width={200} height={14} className={styles.addressSkeleton} />
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </header>
  );
};
