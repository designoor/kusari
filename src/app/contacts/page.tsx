'use client';

import { useState, useMemo, useCallback } from 'react';
import { ConsentState } from '@xmtp/browser-sdk';
import {
  ContactSearch,
  ContactSectionLink,
  ContactList,
} from '@/components/contacts';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { ErrorState } from '@/components/ui/ErrorState';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { InboxIcon, BanIcon } from '@/components/ui/Icon/icons';
import { useCoordinatedConversations, useCoordinatedMessageRequests } from '@/hooks/useCoordinatedConversations';
import { useNewChatModal } from '@/providers/NewChatModalProvider';
import styles from './contacts.module.css';

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { openModal } = useNewChatModal();

  // Get all conversations with coordinated Ethos loading
  const { previews: allPreviews, ethosProfiles, isLoading, error, refresh } = useCoordinatedConversations();

  // Get message requests count (uses same underlying data but filtered)
  const { previews: requestPreviews } = useCoordinatedMessageRequests();

  const handleRetry = useCallback(() => {
    void refresh();
  }, [refresh]);

  // Filter for allowed contacts
  const allowedContacts = useMemo(
    () =>
      allPreviews.filter(
        (preview) => preview.consentState === ConsentState.Allowed
      ),
    [allPreviews]
  );

  // Filter for denied contacts
  const deniedContacts = useMemo(
    () =>
      allPreviews.filter(
        (preview) => preview.consentState === ConsentState.Denied
      ),
    [allPreviews]
  );

  // Apply search filter (by wallet address or inbox ID)
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return allowedContacts;

    const query = searchQuery.toLowerCase();
    return allowedContacts.filter((contact) =>
      contact.peerAddress?.toLowerCase().includes(query) ||
      contact.peerInboxId?.toLowerCase().includes(query)
    );
  }, [allowedContacts, searchQuery]);

  // Error state
  if (error && !isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <ErrorState
            title="Failed to load contacts"
            error={error}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Contacts"
        actions={[{
          label: 'New Chat',
          onClick: openModal,
          variant: 'ghost',
          icon: <Icon name="plus" size="sm" />
        }]}
        size="lg"
      />
      <div className={styles.searchContainer}>
        <ContactSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search contacts..."
        />
      </div>

      <div className={styles.sections}>
        <ContactSectionLink
          href="/contacts/requests"
          icon={<InboxIcon size={20} />}
          title="New requests"
          description="Message requests from unknown contacts"
          count={requestPreviews.length}
          variant="accent"
        />

        <ContactSectionLink
          href="/contacts/denied"
          icon={<BanIcon size={20} />}
          title="Denied"
          description="Blocked contacts"
          count={deniedContacts.length}
          variant="default"
        />
      </div>

      <div className={styles.contactsSection}>
        <SectionTitle>Accepted Contacts</SectionTitle>
        <ContactList
          contacts={filteredContacts}
          ethosProfiles={ethosProfiles}
          isLoading={isLoading}
          emptyTitle="No contacts yet"
          emptyDescription="Accept message requests to add contacts"
          activeAddress={undefined}
        />
      </div>
    </div>
  );
}
