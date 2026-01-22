'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { EthosScore } from '@/components/reputation/EthosScore';
import { useEthosScore } from '@/hooks';
import type { EthosProfile } from '@/services/ethos';
import styles from './ContactItem.module.css';

export interface ContactItemProps {
  /** Peer inbox ID / address */
  address: string;
  /** Optional display name or ENS name */
  displayName?: string;
  /** Optional conversation ID for navigation */
  conversationId?: string;
  /** Whether this item is currently active/selected */
  isActive?: boolean;
  /** Click handler - if provided, overrides default navigation */
  onClick?: () => void;
  /** Pre-fetched Ethos profile (for batch optimization) */
  ethosProfile?: EthosProfile | null;
}

/**
 * ContactItem displays a single contact in a list.
 *
 * Used in:
 * - Contacts list (accepted contacts)
 * - Message requests list
 * - Denied contacts list
 */
export const ContactItem: React.FC<ContactItemProps> = React.memo(({
  address,
  displayName,
  conversationId,
  isActive = false,
  onClick,
  ethosProfile: externalEthosProfile,
}) => {
  // Fetch Ethos profile only if not provided externally (fallback for standalone usage)
  const { data: fetchedEthosProfile } = useEthosScore(externalEthosProfile ? null : address);
  const ethosProfile = externalEthosProfile ?? fetchedEthosProfile;

  // Use Ethos username if available, otherwise fall back to displayName
  const ethosName = ethosProfile?.username ?? displayName;

  /** Opens Ethos profile in a new tab */
  const handleProfileClick = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const content = (
    <>
      <Avatar address={address} src={ethosProfile?.avatarUrl} size="md" className={styles.avatar} />
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.name}>{ethosName ?? address}</span>
          <EthosScore
            address={address}
            size="sm"
            variant="compact"
            onProfileClick={handleProfileClick}
            ethosProfile={ethosProfile}
          />
        </div>
        {ethosName && <span className={styles.address}>{address}</span>}
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
});

ContactItem.displayName = 'ContactItem';
