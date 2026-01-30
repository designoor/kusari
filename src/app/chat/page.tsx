'use client';

import { useCallback, useState } from 'react';
import { ConversationList } from '@/components/chat/ConversationList';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useConversationList } from '@/providers/ConversationListProvider';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useNewChatModal } from '@/providers/NewChatModalProvider';
import styles from './chat.module.css';

export default function ChatPage() {
  const isMobile = useIsMobile();
  const { previews, ethosProfiles, isInitialLoading, error, refresh } = useConversationList();
  const { openModal } = useNewChatModal();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Refresh with minimum 1 second cooldown
      await Promise.all([
        refresh(),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleRetry = useCallback(() => {
    void handleRefresh();
  }, [handleRefresh]);

  const headerActions = (
    <div className={styles.headerActions}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void handleRefresh()}
        disabled={isRefreshing}
        aria-label="Refresh conversations"
        className={`${styles.iconButton} ${isRefreshing ? styles.refreshing : ''}`}
      >
        <Icon name="refresh" size="sm" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={openModal}
        aria-label="New conversation"
        className={styles.iconButton}
      >
        <Icon name="plus" size="sm" />
      </Button>
    </div>
  );

  // Error state
  if (error && !isInitialLoading) {
    return (
      <div className={styles.container}>
        <PageHeader
          title="Messages"
          size="lg"
          actionsElement={headerActions}
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
          actionsElement={headerActions}
        />
        <ConversationList
          conversations={previews}
          ethosProfiles={ethosProfiles}
          isLoading={isInitialLoading || isRefreshing}
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
