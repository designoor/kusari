'use client';

import { ContactList } from '@/components/contacts';
import { PageHeader } from '@/components/ui/PageHeader';
import { useCoordinatedDeniedContacts } from '@/hooks/useCoordinatedConversations';
import styles from '../subpage.module.css';

export default function DeniedPage() {
  const { previews: deniedContacts, ethosProfiles, isLoading } = useCoordinatedDeniedContacts();

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
          ethosProfiles={ethosProfiles}
          isLoading={isLoading}
          emptyTitle="No blocked contacts"
          emptyDescription="When you block someone, they will appear here"
        />
      </div>
    </div>
  );
}
