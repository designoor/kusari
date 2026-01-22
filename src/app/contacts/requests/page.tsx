'use client';

import { useCallback } from 'react';
import { ContactList } from '@/components/contacts';
import { PageHeader } from '@/components/ui/PageHeader';
import { useMessageRequests } from '@/hooks/useConversations';
import styles from '../subpage.module.css';

export default function RequestsPage() {
  const { filteredPreviews: requests, isLoading, refresh } = useMessageRequests();

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className={styles.container}>
      <PageHeader
        title="New Requests"
        subtitle="Review message requests before accepting. Check reputation to make informed decisions."
        backButton={{ href: '/contacts' }}
        size="lg"
      />

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
          useContextProfiles={false}
        />
      </div>
    </div>
  );
}
