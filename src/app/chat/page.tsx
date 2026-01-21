'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationList } from '@/components/chat/ConversationList';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { useAllowedConversations } from '@/hooks/useConversations';
import { useIsMobile } from '@/hooks/useMediaQuery';
import styles from './chat.module.css';

export default function ChatPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { filteredPreviews, isLoading, error, refresh } = useAllowedConversations();

  const handleNewConversation = useCallback(() => {
    router.push('/contacts');
  }, [router]);

  const handleRetry = useCallback(() => {
    void refresh();
  }, [refresh]);

  // Error state
  if (error && !isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <ErrorState
            title="Failed to load conversations"
            error={error}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <ConversationList
          conversations={filteredPreviews}
          isLoading={isLoading}
          emptyStateTitle="No conversations yet"
          emptyStateDescription="Find contacts to start a new conversation"
          emptyStateAction={{
            label: 'Find contacts',
            onClick: handleNewConversation,
          }}
        />
      </div>
      {!isMobile && (
        <div className={styles.main}>
          <div className={styles.placeholder}>
            <EmptyState
              icon={<Icon name="chat" size="xl" />}
              title="Select a conversation"
              description="Choose a conversation from the list to start messaging"
            />
          </div>
        </div>
      )}
    </div>
  );
}
