'use client';

import { useCallback } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Icon } from '@/components/ui/Icon';
import { useAllowedConversations } from '@/hooks/useConversations';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useNewChatModal } from '@/providers/NewChatModalProvider';
import styles from './chat.module.css';

export default function ChatPage() {
  const isMobile = useIsMobile();
  const { filteredPreviews, isLoading, error, refresh } = useAllowedConversations();
  const { openModal } = useNewChatModal();

  const handleRetry = useCallback(() => {
    void refresh();
  }, [refresh]);

  // Error state
  if (error && !isLoading) {
    return (
      <div className={styles.container}>
        <PageHeader
          title="Messages"
          size="lg"
          actions={[{
            label: 'New',
            onClick: openModal,
            variant: 'ghost',
            icon: <Icon name="plus" size="sm" />
          }]}
        />
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
        <PageHeader
          title="Messages"
          size="lg"
          actions={[{
            label: 'New',
            onClick: openModal,
            variant: 'ghost',
            icon: <Icon name="plus" size="sm" />
          }]}
        />
        <ConversationList
          conversations={filteredPreviews}
          isLoading={isLoading}
          emptyStateTitle="No conversations yet"
          emptyStateDescription="Find contacts to start a new conversation"
          emptyStateAction={{
            label: 'Find contacts',
            onClick: openModal,
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
