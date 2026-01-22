'use client';

import { useMemo } from 'react';
import { ConsentState } from '@xmtp/browser-sdk';
import { ContactList } from '@/components/contacts';
import { PageHeader } from '@/components/ui/PageHeader';
import { useConversations } from '@/hooks/useConversations';
import styles from '../subpage.module.css';

export default function DeniedPage() {
  const { filteredPreviews: allPreviews, isLoading } = useConversations();

  // Filter for denied contacts
  const deniedContacts = useMemo(
    () =>
      allPreviews.filter(
        (preview) => preview.consentState === ConsentState.Denied
      ),
    [allPreviews]
  );

  return (
    <div className={styles.container}>
      <PageHeader
        title="Denied Contacts"
        subtitle="Blocked contacts cannot send you messages. You can unblock them from their profile."
        backButton={{ href: '/contacts' }}
        size="lg"
      />

      <div className={styles.content}>
        <ContactList
          contacts={deniedContacts}
          isLoading={isLoading}
          emptyTitle="No blocked contacts"
          emptyDescription="When you block someone, they will appear here"
          useContextProfiles={false}
        />
      </div>
    </div>
  );
}
