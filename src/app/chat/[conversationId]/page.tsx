'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { useMessages } from '@/hooks/useMessages';
import { useAllowedConversations } from '@/hooks/useConversations';
import { useXmtpContext } from '@/providers/XmtpProvider';
import { getConversationById, isDm } from '@/services/xmtp/conversations';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { Conversation } from '@/types/conversation';
import styles from './conversation.module.css';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversationId as string;
  const isMobile = useIsMobile();
  const { client, isInitialized } = useXmtpContext();

  // Get conversation list for desktop sidebar
  const { filteredPreviews, isLoading: isLoadingConversations } = useAllowedConversations();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [peerInboxId, setPeerInboxId] = useState<string | undefined>();
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const {
    messageGroups,
    isLoading: isLoadingMessages,
    sendMessage,
    isSending,
  } = useMessages(conversationId);

  // Load conversation metadata
  const loadConversation = useCallback(async () => {
    if (!client || !isInitialized || !conversationId) {
      return;
    }

    setIsLoadingConversation(true);
    setLoadError(null);

    try {
      const conv = await getConversationById(client, conversationId);
      if (conv) {
        setConversation(conv);
        if (isDm(conv)) {
          const peerId = await conv.peerInboxId();
          setPeerInboxId(peerId);
        }
      } else {
        setConversation(null);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      setLoadError(error instanceof Error ? error : new Error('Failed to load conversation'));
    } finally {
      setIsLoadingConversation(false);
    }
  }, [client, isInitialized, conversationId]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  // Render conversation panel content
  const renderConversationPanel = () => {
    // Loading state
    if (isLoadingConversation) {
      return (
        <div className={styles.conversationPanel}>
          <div className={styles.headerSkeleton}>
            <Skeleton variant="circular" width={40} height={40} />
            <div className={styles.headerSkeletonContent}>
              <Skeleton variant="text" width={120} height={16} />
              <Skeleton variant="text" width={200} height={14} />
            </div>
          </div>
          <div className={styles.messagesSkeleton}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`${styles.messageSkeleton} ${i % 2 === 0 ? styles.left : styles.right}`}
              >
                <Skeleton variant="rectangular" width="60%" height={48} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Error state - failed to load (network error, etc.)
    if (loadError) {
      return (
        <div className={styles.conversationPanel}>
          <div className={styles.errorState}>
            <EmptyState
              icon={<Icon name="x" size="xl" />}
              title="Failed to load conversation"
              description="Something went wrong. Please try again."
              action={{
                label: 'Try again',
                onClick: () => void loadConversation(),
              }}
            />
          </div>
        </div>
      );
    }

    // Not found state - conversation doesn't exist
    if (!conversation) {
      return (
        <div className={styles.conversationPanel}>
          <div className={styles.notFound}>
            <EmptyState
              icon={<Icon name="chat" size="xl" />}
              title="Conversation not found"
              description="This conversation may have been deleted or doesn't exist."
            />
          </div>
        </div>
      );
    }

    const conversationIsDm = isDm(conversation);

    return (
      <div className={styles.conversationPanel}>
        <ChatHeader
          peerInboxId={peerInboxId}
          groupName={!conversationIsDm ? (conversation.name ?? undefined) : undefined}
          isDm={conversationIsDm}
          showBackButton={isMobile}
          backHref="/chat"
        />
        <MessageList
          messageGroups={messageGroups}
          isLoading={isLoadingMessages}
          emptyStateTitle="No messages yet"
          emptyStateDescription="Send a message to start the conversation"
        />
        <MessageInput
          onSend={handleSendMessage}
          loading={isSending}
          placeholder="Type a message..."
        />
      </div>
    );
  };

  // Mobile: Only show conversation panel
  if (isMobile) {
    return <div className={styles.container}>{renderConversationPanel()}</div>;
  }

  // Desktop: Split view with sidebar
  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <ConversationList
          conversations={filteredPreviews}
          isLoading={isLoadingConversations}
          activeConversationId={conversationId}
          emptyStateTitle="No conversations yet"
          emptyStateDescription="Start a new conversation to begin messaging"
        />
      </div>
      <div className={styles.main}>{renderConversationPanel()}</div>
    </div>
  );
}
