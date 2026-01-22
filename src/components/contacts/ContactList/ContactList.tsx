'use client';

import React, { useMemo } from 'react';
import { ContactItem } from '../ContactItem';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useEthosScores, useEthosContext } from '@/hooks';
import type { EthosProfile } from '@/services/ethos';
import type { ConversationPreview } from '@/types/conversation';
import styles from './ContactList.module.css';

export interface ContactListProps {
  /** Contacts to display */
  contacts: ConversationPreview[];
  /** Whether data is loading */
  isLoading?: boolean;
  /** Title for empty state */
  emptyTitle?: string;
  /** Description for empty state */
  emptyDescription?: string;
  /** Action for empty state */
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  /** Currently active contact address */
  activeAddress?: string;
  /** Additional CSS class */
  className?: string;
  /**
   * Whether to use the global Ethos context for profiles.
   * Set to false for requests/denied pages to fetch locally.
   * @default true
   */
  useContextProfiles?: boolean;
}

/**
 * ContactList renders a list of contacts with loading and empty states.
 */
export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  isLoading = false,
  emptyTitle = 'No contacts',
  emptyDescription,
  emptyAction,
  activeAddress,
  className,
  useContextProfiles = true,
}) => {
  // Get global context profiles (for allowed contacts)
  const ethosContext = useEthosContext();

  // Extract addresses for local batch fetching (only when not using context)
  const addressesForLocalFetch = useMemo(() => {
    if (useContextProfiles) {
      return []; // Don't fetch locally if using context
    }
    return contacts
      .map((contact) => contact.peerAddress ?? contact.peerInboxId)
      .filter((addr): addr is string => !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr));
  }, [contacts, useContextProfiles]);

  // Local batch fetch for requests/denied pages
  const { profiles: localProfiles } = useEthosScores(addressesForLocalFetch);

  // Use context profiles or local profiles based on prop
  const ethosProfiles: Map<string, EthosProfile> = useContextProfiles
    ? ethosContext.profiles
    : localProfiles;

  // Loading state - show skeletons
  if (isLoading) {
    return (
      <div className={`${styles.list} ${className ?? ''}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={styles.skeletonItem}>
            <Skeleton variant="circular" width={40} height={40} />
            <div className={styles.skeletonContent}>
              <Skeleton variant="text" width="60%" height={16} />
              <Skeleton variant="text" width="40%" height={14} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Filter out contacts without a valid peerInboxId
  const validContacts = contacts.filter(
    (contact): contact is ConversationPreview & { peerInboxId: string } =>
      contact.peerInboxId != null && contact.peerInboxId !== ''
  );

  // Empty state
  if (validContacts.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  return (
    <div className={`${styles.list} ${className ?? ''}`} role="list">
      {validContacts.map((contact) => {
        const address = contact.peerAddress ?? contact.peerInboxId;
        const ethosProfile = ethosProfiles.get(address.toLowerCase());

        return (
          <ContactItem
            key={contact.id}
            address={address}
            conversationId={contact.id}
            isActive={contact.peerInboxId === activeAddress}
            ethosProfile={ethosProfile}
          />
        );
      })}
    </div>
  );
};
