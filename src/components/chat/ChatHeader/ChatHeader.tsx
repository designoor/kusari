'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { EthosScore } from '@/components/reputation/EthosScore';
import { useEthosScore } from '@/hooks/useEthosScore';
import styles from './ChatHeader.module.css';

export interface ChatHeaderProps {
  peerInboxId?: string;
  /** Ethereum address for display (resolved from inbox ID) */
  peerAddress?: string;
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
  peerAddress,
  groupName,
  isDm = true,
  showBackButton = false,
  backHref = '/chat',
  onBackClick,
  isLoading = false,
}) => {
  // Use peerAddress for display, fall back to peerInboxId
  const addressForDisplay = peerAddress ?? peerInboxId;

  // Fetch Ethos profile for the peer address
  const { data: ethosProfile } = useEthosScore(isDm ? addressForDisplay : undefined);

  // Get Ethos username if available
  const ethosUsername = ethosProfile?.username || ethosProfile?.displayName;

  // Primary display: username (with @) if available, otherwise address; for groups use group name
  const primaryName = isDm
    ? (ethosUsername ? `@${ethosUsername}` : (addressForDisplay ?? 'Unknown'))
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
            <Skeleton variant="text" width={80} height={14} className={styles.usernameSkeleton} />
          </div>
        </>
      ) : (
        <>
          <Avatar
            address={addressForDisplay}
            size="md"
            className={styles.avatar}
          />
          <div className={styles.info}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{primaryName}</h1>
              {isDm && addressForDisplay && (
                <EthosScore address={addressForDisplay} size="sm" variant="compact" />
              )}
            </div>
            {isDm && addressForDisplay && (
              <p className={styles.address} title={addressForDisplay}>{addressForDisplay}</p>
            )}
          </div>
        </>
      )}
    </header>
  );
};
