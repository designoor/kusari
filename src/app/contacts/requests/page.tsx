'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { ContactList } from '@/components/contacts';
import { ChevronLeftIcon } from '@/components/ui/Icon/icons';
import { useMessageRequests } from '@/hooks/useConversations';
import styles from '../subpage.module.css';

export default function RequestsPage() {
  const { filteredPreviews: requests, isLoading, refresh } = useMessageRequests();

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/contacts" className={styles.backLink}>
          <ChevronLeftIcon size={20} />
          <span>Contacts</span>
        </Link>
        <h1 className={styles.title}>New Requests</h1>
        <p className={styles.description}>
          Review message requests before accepting. Check reputation to make informed decisions.
        </p>
      </div>

      <div className={styles.content}>
        <ContactList
          contacts={requests}
          isLoading={isLoading}
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
