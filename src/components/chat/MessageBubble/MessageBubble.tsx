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
  /** Whether this is the last message from the current user (for showing read status) */
  isLastFromUser?: boolean;
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

  if (status === 'read') {
    return (
      <span className={`${styles.status} ${styles.read}`} aria-label="Read">
        <Icon name="check-double" size="sm" />
      </span>
    );
  }

  // Sent status - show single checkmark
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
  isLastFromUser = false,
}) => {
  const { content, isFromCurrentUser, sentAt, status, type } = message;

  // System messages (membership changes, etc.) are displayed differently
  if (type === 'system') {
    return (
      <div className={styles.systemWrapper}>
        <div className={styles.systemBubble}>
          <p className={styles.systemContent}>{content}</p>
          {showTimestamp && (
            <span className={styles.systemTime}>{formatMessageTime(sentAt)}</span>
          )}
        </div>
      </div>
    );
  }

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
          {isFromCurrentUser && isLastFromUser && <StatusIndicator status={status} />}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
