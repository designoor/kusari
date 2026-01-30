'use client';

import { useState, useMemo, useCallback } from 'react';
import { ContactList, ContactSearch } from '@/components/contacts';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCoordinatedMessageRequests } from '@/hooks/useCoordinatedConversations';
import styles from '../subpage.module.css';

export default function RequestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { previews: requests, ethosProfiles, isInitialLoading, refresh } = useCoordinatedMessageRequests();

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  // Filter requests by address, inbox ID, or Ethos username
  const filteredRequests = useMemo(() => {
    if (!searchQuery) return requests;

    const query = searchQuery.toLowerCase();
    return requests.filter((contact) => {
      const matchesAddress = contact.peerAddress?.toLowerCase().includes(query);
      const matchesInboxId = contact.peerInboxId?.toLowerCase().includes(query);
      const address = (contact.peerAddress ?? contact.peerInboxId)?.toLowerCase();
      const ethosProfile = address ? ethosProfiles.get(address) : undefined;
      const matchesUsername = ethosProfile?.username?.toLowerCase().includes(query);
      return matchesAddress || matchesInboxId || matchesUsername;
    });
  }, [requests, searchQuery, ethosProfiles]);

  return (
    <div className={styles.container}>
      <PageHeader
        title="New Requests"
        backButton={{ href: '/contacts' }}
        size="lg"
      />

      <div className={styles.searchContainer}>
        <ContactSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search requests..."
        />
      </div>

      <div className={styles.content}>
        <ContactList
          contacts={filteredRequests}
          ethosProfiles={ethosProfiles}
          isLoading={isInitialLoading}
          emptyTitle="No pending requests"
          emptyDescription="When someone messages you for the first time, their request will appear here"
          emptyAction={{
            label: 'Refresh',
            onClick: handleRefresh,
          }}
        />
      </div>
    </div>
  );
}
