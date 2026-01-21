'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { EthosScore } from '@/components/reputation/EthosScore';
import { truncateAddress, formatRelativeTime } from '@/lib';
import styles from './ContactItem.module.css';

export interface ContactItemProps {
  /** Peer inbox ID / address */
  address: string;
  /** Optional display name or ENS name */
  displayName?: string;
  /** Optional last message preview */
  lastMessage?: string;
  /** Optional timestamp */
  timestamp?: Date;
  /** Optional conversation ID for navigation */
  conversationId?: string;
  /** Whether this item is currently active/selected */
  isActive?: boolean;
  /** Click handler - if provided, overrides default navigation */
  onClick?: () => void;
}

/**
 * ContactItem displays a single contact in a list.
 *
 * Used in:
 * - Contacts list (accepted contacts)
 * - Message requests list
 * - Denied contacts list
 */
export const ContactItem: React.FC<ContactItemProps> = ({
  address,
  displayName,
  lastMessage,
  timestamp,
  conversationId,
  isActive = false,
  onClick,
}) => {
  // Display name: use provided name or truncate address
  const name = displayName ?? truncateAddress(address, 6, 4);

  /** Opens Ethos profile in a new tab */
  const handleProfileClick = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // Time display
  const timeDisplay = timestamp ? formatRelativeTime(timestamp) : '';

  const content = (
    <>
      <Avatar address={address} size="md" className={styles.avatar} />
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.name}>{name}</span>
          <EthosScore
            address={address}
            size="sm"
            variant="compact"
            onProfileClick={handleProfileClick}
          />
        </div>
        {(lastMessage || timeDisplay) && (
          <div className={styles.secondary}>
            {lastMessage && (
              <span className={styles.message}>{lastMessage}</span>
            )}
            {timeDisplay && (
              <span className={styles.time}>{timeDisplay}</span>
            )}
          </div>
        )}
      </div>
    </>
  );

  // If onClick is provided, render as button
  if (onClick) {
    return (
      <button
        type="button"
        className={`${styles.item} ${isActive ? styles.active : ''}`}
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
      >
        {content}
      </button>
    );
  }

  // Default: render as link to contact detail or chat
  const href = conversationId
    ? `/contacts/${encodeURIComponent(address)}?conversation=${conversationId}`
    : `/contacts/${encodeURIComponent(address)}`;

  return (
    <Link
      href={href}
      className={`${styles.item} ${isActive ? styles.active : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {content}
    </Link>
  );
};
