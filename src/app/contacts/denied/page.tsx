'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ConsentState } from '@xmtp/browser-sdk';
import { ContactList } from '@/components/contacts';
import { ChevronLeftIcon } from '@/components/ui/Icon/icons';
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
      <div className={styles.header}>
        <Link href="/contacts" className={styles.backLink}>
          <ChevronLeftIcon size={20} />
          <span>Contacts</span>
        </Link>
        <h1 className={styles.title}>Denied Contacts</h1>
        <p className={styles.description}>
          Blocked contacts cannot send you messages. You can unblock them from their profile.
        </p>
      </div>

      <div className={styles.content}>
        <ContactList
          contacts={deniedContacts}
          isLoading={isLoading}
          emptyTitle="No blocked contacts"
          emptyDescription="When you block someone, they will appear here"
        />
      </div>
    </div>
  );
}
