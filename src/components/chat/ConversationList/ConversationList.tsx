'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConversationItem } from '../ConversationItem';
import type { ConversationPreview } from '@/types/conversation';
import styles from './ConversationList.module.css';

export interface ConversationListProps {
  conversations: ConversationPreview[];
  isLoading?: boolean;
  activeConversationId?: string | null;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading = false,
  activeConversationId,
  emptyStateTitle = 'No conversations',
  emptyStateDescription = 'Start a new conversation to begin messaging',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      const matchesInboxId = conv.peerInboxId?.toLowerCase().includes(query);
      const matchesGroupName = conv.groupName?.toLowerCase().includes(query);
      const matchesContent = conv.lastMessage?.content.toLowerCase().includes(query);
      return matchesInboxId || matchesGroupName || matchesContent;
    });
  }, [conversations, searchQuery]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.searchWrapper}>
          <Input
            variant="search"
            placeholder="Search conversations..."
            disabled
            fullWidth
            leftElement={<Icon name="search" size="sm" />}
          />
        </div>
        <div className={styles.list} role="list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.skeletonItem}>
              <Skeleton variant="circular" width={40} height={40} />
              <div className={styles.skeletonContent}>
                <Skeleton variant="text" width="60%" height={16} />
                <Skeleton variant="text" width="80%" height={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.searchWrapper}>
          <Input
            variant="search"
            placeholder="Search conversations..."
            disabled
            fullWidth
            leftElement={<Icon name="search" size="sm" />}
          />
        </div>
        <div className={styles.emptyContainer}>
          <EmptyState
            icon={<Icon name="chat" size="xl" />}
            title={emptyStateTitle}
            description={emptyStateDescription}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <Input
          variant="search"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          leftElement={<Icon name="search" size="sm" />}
          rightElement={
            searchQuery && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <Icon name="x" size="sm" />
              </button>
            )
          }
        />
      </div>
      <div className={styles.list} role="list">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
            />
          ))
        ) : (
          <div className={styles.noResults}>
            <p>No conversations match &ldquo;{searchQuery}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
};
