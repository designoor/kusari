'use client';

import { useState, useMemo } from 'react';
import { ConsentState } from '@xmtp/browser-sdk';
import {
  ContactSearch,
  ContactSectionLink,
  ContactList,
} from '@/components/contacts';
import { InboxIcon, BanIcon } from '@/components/ui/Icon/icons';
import { useConversations, useMessageRequests } from '@/hooks/useConversations';
import styles from './contacts.module.css';

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all conversations to filter by consent state
  const { filteredPreviews: allPreviews, isLoading } = useConversations();

  // Get message requests count
  const { filteredPreviews: requestPreviews } = useMessageRequests();

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

  // Apply search filter (address only)
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return allowedContacts;

    const query = searchQuery.toLowerCase();
    return allowedContacts.filter((contact) =>
      contact.peerInboxId?.toLowerCase().includes(query)
    );
  }, [allowedContacts, searchQuery]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contacts</h1>
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
        <h2 className={styles.sectionTitle}>Accepted Contacts</h2>
        <ContactList
          contacts={filteredContacts}
          isLoading={isLoading}
          emptyTitle="No contacts yet"
          emptyDescription="Accept message requests to add contacts"
          activeAddress={undefined}
        />
      </div>
    </div>
  );
}
