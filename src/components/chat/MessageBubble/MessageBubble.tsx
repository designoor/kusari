'use client';

import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { formatMessageTime } from '@/lib';
import type { MessageDisplay, MessageStatus } from '@/types/message';
import styles from './MessageBubble.module.css';

export interface MessageBubbleProps {
  message: MessageDisplay;
  showTimestamp?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

const StatusIndicator = React.memo(({ status }: { status: MessageStatus }) => {
  if (status === 'sending') {
    return (
      <span className={styles.status} aria-label="Sending">
        <Icon name="loader" size="sm" />
      </span>
    );
  }

  if (status === 'failed') {
    return (
      <span className={`${styles.status} ${styles.failed}`} aria-label="Failed to send">
        <Icon name="x" size="sm" />
      </span>
    );
  }

  // Sent status - show checkmark
  return (
    <span className={`${styles.status} ${styles.sent}`} aria-label="Sent">
      <Icon name="check" size="sm" />
    </span>
  );
});

StatusIndicator.displayName = 'StatusIndicator';

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  showTimestamp = false,
  isFirst = false,
  isLast = false,
}) => {
  const { content, isFromCurrentUser, sentAt, status } = message;

  const bubbleClasses = [
    styles.bubble,
    isFromCurrentUser ? styles.sent : styles.received,
    isFirst ? styles.first : '',
    isLast ? styles.last : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`${styles.wrapper} ${isFromCurrentUser ? styles.alignRight : styles.alignLeft}`}
    >
      <div className={bubbleClasses}>
        <p className={styles.content}>{content}</p>
        <div className={styles.meta}>
          {showTimestamp && (
            <span className={styles.time}>{formatMessageTime(sentAt)}</span>
          )}
          {isFromCurrentUser && <StatusIndicator status={status} />}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
