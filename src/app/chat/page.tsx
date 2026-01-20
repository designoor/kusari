'use client';

import { ConversationList } from '@/components/chat/ConversationList';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { useAllowedConversations } from '@/hooks/useConversations';
import { useIsMobile } from '@/hooks/useMediaQuery';
import styles from './chat.module.css';

export default function ChatPage() {
  const isMobile = useIsMobile();
  const { filteredPreviews, isLoading } = useAllowedConversations();

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <ConversationList
          conversations={filteredPreviews}
          isLoading={isLoading}
          emptyStateTitle="No conversations yet"
          emptyStateDescription="Start a new conversation to begin messaging"
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
