'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConversationItem } from '../ConversationItem';
import type { ConversationPreview } from '@/types/conversation';
import type { EthosProfile } from '@/services/ethos';
import styles from './ConversationList.module.css';

export interface ConversationListProps {
  conversations: ConversationPreview[];
  /** Pre-fetched Ethos profiles (keyed by lowercase address) */
  ethosProfiles?: Map<string, EthosProfile>;
  isLoading?: boolean;
  activeConversationId?: string | null;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: {
    label: string;
    onClick: () => void;
  };
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  ethosProfiles = new Map(),
  isLoading = false,
  activeConversationId,
  emptyStateTitle = 'No conversations',
  emptyStateDescription = 'Start a new conversation to begin messaging',
  emptyStateAction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query (searches contact name/address, not message content)
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    const query = searchQuery.toLowerCase();
    return conversations.filter((conv) => {
      // For group chats, search by group name
      if (!conv.isDm) {
        return conv.groupName?.toLowerCase().includes(query);
      }

      // For DMs, search by address or Ethos username
      const address = (conv.peerAddress ?? conv.peerInboxId)?.toLowerCase();
      const matchesAddress = address?.includes(query);

      // Check Ethos username if profile exists
      const ethosProfile = address ? ethosProfiles.get(address) : undefined;
      const matchesUsername = ethosProfile?.username?.toLowerCase().includes(query);

      return matchesAddress || matchesUsername;
    });
  }, [conversations, searchQuery, ethosProfiles]);

  // Render content based on state
  const renderContent = () => {
    // Loading skeleton - show whenever loading (initial load or refresh)
    if (isLoading) {
      return (
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
      );
    }

    // Empty state - only show when not loading and no conversations
    if (conversations.length === 0) {
      return (
        <div className={styles.emptyContainer}>
          <EmptyState
            icon={<Icon name="chat" size="xl" />}
            title={emptyStateTitle}
            description={emptyStateDescription}
            action={emptyStateAction}
          />
        </div>
      );
    }

    // Conversation list
    return (
      <div className={styles.list} role="list">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => {
            // Get pre-fetched Ethos profile for this conversation (if DM)
            const address = conversation.isDm
              ? (conversation.peerAddress ?? conversation.peerInboxId)?.toLowerCase()
              : undefined;
            const ethosProfile = address ? ethosProfiles.get(address) : undefined;

            return (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                ethosProfile={ethosProfile}
              />
            );
          })
        ) : (
          <div className={styles.noResults}>
            <p>No contacts match &ldquo;{searchQuery}&rdquo;</p>
          </div>
        )}
      </div>
    );
  };

  // Disable search when loading or empty
  const isSearchDisabled = isLoading || conversations.length === 0;

  return (
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <Input
          size="md"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isSearchDisabled}
          fullWidth
          leftElement={<Icon name="search" size="sm" />}
          rightElement={
            searchQuery && !isSearchDisabled && (
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
      {renderContent()}
    </div>
  );
};
