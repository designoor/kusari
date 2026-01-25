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
import { useCoordinatedConversations } from '@/hooks/useCoordinatedConversations';
import { useMessageRequests, useDeniedConversations } from '@/hooks/useConversations';
import { useNewChatModal } from '@/providers/NewChatModalProvider';
import styles from './contacts.module.css';

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { openModal } = useNewChatModal();

  // Get allowed contacts with coordinated Ethos loading (shares cache with /chat)
  const { previews: allowedContacts, ethosProfiles, isLoading, isInitialLoading, error, refresh } =
    useCoordinatedConversations({ consentState: ConsentState.Allowed });

  // Get counts without Ethos (fetched on-demand when visiting those pages)
  const { filteredPreviews: requestPreviews } = useMessageRequests();
  const { filteredPreviews: deniedPreviews } = useDeniedConversations();

  const handleRetry = useCallback(() => {
    void refresh();
  }, [refresh]);

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
          variant="new"
        />

        <ContactSectionLink
          href="/contacts/denied"
          icon={<BanIcon size={20} />}
          title="Denied"
          description="Blocked contacts"
          count={deniedPreviews.length}
          variant="default"
        />
      </div>

      <div className={styles.contactsSection}>
        <SectionTitle>Accepted Contacts</SectionTitle>
        <ContactList
          contacts={filteredContacts}
          ethosProfiles={ethosProfiles}
          isLoading={isInitialLoading}
          emptyTitle="No contacts yet"
          emptyDescription="Accept message requests to add contacts"
          activeAddress={undefined}
        />
      </div>
    </div>
  );
}
