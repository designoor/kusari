'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import styles from './MessageInput.module.css';

export interface MessageInputProps {
  onSend: (content: string) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  loading = false,
  placeholder = 'Type a message...',
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wasLoadingRef = useRef(loading);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 120; // Max 5 lines approximately
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, []);

  // Refocus textarea when loading completes
  useEffect(() => {
    if (wasLoadingRef.current && !loading) {
      textareaRef.current?.focus();
    }
    wasLoadingRef.current = loading;
  }, [loading]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmedMessage = message.trim();
      if (!trimmedMessage || disabled || loading) {
        return;
      }

      // Clear message optimistically
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Fire send - parent handles async state
      void onSend(trimmedMessage);
    },
    [message, disabled, loading, onSend]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
      adjustTextareaHeight();
    },
    [adjustTextareaHeight]
  );

  const isDisabled = disabled || loading;
  const canSend = message.trim().length > 0 && !isDisabled;

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <div className={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isDisabled}
          rows={1}
          aria-label="Message"
        />
      </div>
      {(message.trim().length > 0 || loading) && (
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!canSend}
          loading={loading}
          leftIcon={<Icon name="arrow-up-right" size="md" />}
          aria-label="Send message"
          className={styles.sendButton}
        />
      )}
    </form>
  );
};
