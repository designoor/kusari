'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageBubble } from '../MessageBubble';
import { formatMessageSeparator } from '@/lib';
import type { MessageGroup } from '@/types/message';
import styles from './MessageList.module.css';

// TODO: For conversations with 500+ messages, consider implementing virtualization
// using react-virtuoso (handles dynamic heights better than react-window)
// See: https://virtuoso.dev/

export interface MessageListProps {
  messageGroups: MessageGroup[];
  isLoading?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

/**
 * Get total message count from groups
 */
function getMessageCount(groups: MessageGroup[]): number {
  return groups.reduce((count, group) => count + group.messages.length, 0);
}

export const MessageList: React.FC<MessageListProps> = ({
  messageGroups,
  isLoading = false,
  emptyStateTitle = 'No messages yet',
  emptyStateDescription = 'Send a message to start the conversation',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  // Track previous message count to detect actual new messages
  const prevMessageCountRef = useRef(0);

  // Check if user is near the bottom of the scroll container
  const checkIfNearBottom = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return true;

    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Track scroll position to determine if we should auto-scroll
  const handleScroll = useCallback(() => {
    isNearBottomRef.current = checkIfNearBottom();
  }, [checkIfNearBottom]);

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    const currentCount = getMessageCount(messageGroups);
    const prevCount = prevMessageCountRef.current;

    // Only scroll if there are actually new messages AND user is near bottom
    // This prevents scrolling when the component re-renders with the same messages
    if (currentCount > prevCount && isNearBottomRef.current) {
      // Use instant scroll for initial load (prevCount === 0), smooth for new messages
      const behavior = prevCount === 0 ? 'auto' : 'smooth';
      messagesEndRef.current?.scrollIntoView({ behavior });
    }

    prevMessageCountRef.current = currentCount;
  }, [messageGroups]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`${styles.skeletonGroup} ${i % 2 === 0 ? styles.alignLeft : styles.alignRight}`}
            >
              <Skeleton
                variant="rectangular"
                width={i % 2 === 0 ? '60%' : '50%'}
                height={48}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (messageGroups.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyWrapper}>
          <EmptyState
            icon={<Icon name="message" size="xl" />}
            title={emptyStateTitle}
            description={emptyStateDescription}
          />
        </div>
      </div>
    );
  }

  // Render messages with day separators
  let lastDate: Date | null = null;

  return (
    <div className={styles.container} ref={scrollRef} onScroll={handleScroll}>
      <div className={styles.messages}>
        {messageGroups.map((group, groupIndex) => {
          const groupDate = group.timestamp;
          const showDateSeparator = !lastDate || !isSameDay(lastDate, groupDate);
          lastDate = groupDate;

          return (
            <React.Fragment key={`group-${groupIndex}`}>
              {showDateSeparator && (
                <div className={styles.dateSeparator}>
                  <span className={styles.dateText}>
                    {formatMessageSeparator(groupDate)}
                  </span>
                </div>
              )}
              <div className={styles.messageGroup}>
                {group.messages.map((message, msgIndex) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    showTimestamp={msgIndex === group.messages.length - 1}
                    isFirst={msgIndex === 0}
                    isLast={msgIndex === group.messages.length - 1}
                  />
                ))}
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
