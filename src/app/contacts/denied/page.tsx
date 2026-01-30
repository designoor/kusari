'use client';

import { useState, useMemo } from 'react';
import { ContactList, ContactSearch } from '@/components/contacts';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCoordinatedDeniedContacts } from '@/hooks/useCoordinatedConversations';
import styles from '../subpage.module.css';

export default function DeniedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { previews: deniedContacts, ethosProfiles, isInitialLoading } = useCoordinatedDeniedContacts();

  // Filter denied contacts by address, inbox ID, or Ethos username
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return deniedContacts;

    const query = searchQuery.toLowerCase();
    return deniedContacts.filter((contact) => {
      const matchesAddress = contact.peerAddress?.toLowerCase().includes(query);
      const matchesInboxId = contact.peerInboxId?.toLowerCase().includes(query);
      const address = (contact.peerAddress ?? contact.peerInboxId)?.toLowerCase();
      const ethosProfile = address ? ethosProfiles.get(address) : undefined;
      const matchesUsername = ethosProfile?.username?.toLowerCase().includes(query);
      return matchesAddress || matchesInboxId || matchesUsername;
    });
  }, [deniedContacts, searchQuery, ethosProfiles]);

  return (
    <div className={styles.container}>
      <PageHeader
        title="Denied Contacts"
        backButton={{ href: '/contacts' }}
        size="lg"
      />

      <div className={styles.searchContainer}>
        <ContactSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search denied contacts..."
        />
      </div>

      <div className={styles.content}>
        <ContactList
          contacts={filteredContacts}
          ethosProfiles={ethosProfiles}
          isLoading={isInitialLoading}
          emptyTitle="No blocked contacts"
          emptyDescription="When you block someone, they will appear here"
        />
      </div>
    </div>
  );
}
