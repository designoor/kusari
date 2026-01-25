'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useLatest } from '@/hooks/useLatest';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { EthosBadgeGroup } from '@/components/reputation/EthosBadgeGroup';
import { useNewChatModal } from '@/providers/NewChatModalProvider';
import { useNewChat } from '@/hooks/useNewChat';
import { useEthosScore } from '@/hooks/useEthosScore';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/providers/ToastProvider';
import { isValidAddress, addressesEqual } from '@/lib/address';
import styles from './NewChatModal.module.css';

type RecipientState =
  | { status: 'empty' }
  | { status: 'invalid'; message: string }
  | { status: 'checking' }
  | { status: 'valid'; address: string; canMessage: boolean }
  | { status: 'error'; message: string };

export interface NewChatModalProps {
  className?: string;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ className }) => {
  const router = useRouter();
  const { isOpen, closeModal } = useNewChatModal();
  const { checkCanMessage, createConversation, isCreating } = useNewChat();
  const { address: userAddress } = useWallet();
  const toast = useToast();

  const [inputValue, setInputValue] = useState('');
  const [recipientState, setRecipientState] = useState<RecipientState>({ status: 'empty' });
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track modal open state for async operations to avoid stale updates
  const isOpenRef = useLatest(isOpen);
  // Track address being checked to prevent stale async results from updating state
  const addressBeingCheckedRef = useRef<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setRecipientState({ status: 'empty' });
      addressBeingCheckedRef.current = null;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }
  }, [isOpen]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (!isOpen || !inputRef.current) {
      return;
    }

    // Small delay to ensure modal animation completes
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Shared synchronous validation for address format
  const validateAddressFormat = useCallback(
    (address: string): RecipientState | null => {
      // Empty input
      if (!address.trim()) {
        return { status: 'empty' };
      }

      // Invalid format
      if (!isValidAddress(address)) {
        return {
          status: 'invalid',
          message: 'Enter a valid Ethereum address (0x...)',
        };
      }

      // Self-messaging check (provides immediate UI feedback; service layer also
      // validates via inbox ID comparison as defense-in-depth)
      if (userAddress && addressesEqual(address, userAddress)) {
        return {
          status: 'invalid',
          message: 'You cannot message yourself',
        };
      }

      // Valid format - needs async check
      return null;
    },
    [userAddress]
  );

  // Async check for XMTP availability (only called for valid format addresses)
  const checkXmtpAvailability = useCallback(
    async (address: string) => {
      // Track which address we're checking to ignore stale results
      addressBeingCheckedRef.current = address;

      try {
        const canMessage = await checkCanMessage(address);
        // Skip state update if modal closed or user typed a different address
        if (!isOpenRef.current || addressBeingCheckedRef.current !== address) return;
        setRecipientState({
          status: 'valid',
          address,
          canMessage,
        });
      } catch (err) {
        // Skip state update if modal closed or user typed a different address
        if (!isOpenRef.current || addressBeingCheckedRef.current !== address) return;
        setRecipientState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Failed to verify address',
        });
      }
    },
    [checkCanMessage]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Immediate format validation
      const validationError = validateAddressFormat(value);
      if (validationError) {
        setRecipientState(validationError);
        return;
      }

      // Valid format - debounce the XMTP availability check
      setRecipientState({ status: 'checking' });
      debounceRef.current = setTimeout(() => {
        checkXmtpAvailability(value);
      }, 300);
    },
    [validateAddressFormat, checkXmtpAvailability]
  );

  const handleStartChat = useCallback(async () => {
    if (recipientState.status !== 'valid' || !recipientState.canMessage) {
      return;
    }

    try {
      const conversationId = await createConversation(recipientState.address);
      closeModal();
      toast.success('Conversation started');
      router.push(`/chat/${conversationId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to start conversation'
      );
    }
  }, [recipientState, createConversation, closeModal, toast, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        e.key === 'Enter' &&
        recipientState.status === 'valid' &&
        recipientState.canMessage &&
        !isCreating
      ) {
        handleStartChat();
      }
    },
    [recipientState, isCreating, handleStartChat]
  );

  // Fetch Ethos profile when we have a valid address
  const ethosAddress = recipientState.status === 'valid' ? recipientState.address : null;
  const { data: ethosProfile, isLoading: isEthosLoading } = useEthosScore(ethosAddress);

  // Determine input error state
  const inputError =
    recipientState.status === 'invalid' || recipientState.status === 'error'
      ? recipientState.message
      : undefined;

  // Can start chat?
  const canStartChat =
    recipientState.status === 'valid' && recipientState.canMessage && !isCreating;

  // Get display name - prefer displayName, fall back to username
  const displayName = useMemo(() => {
    if (recipientState.status !== 'valid' || !ethosProfile) {
      return null;
    }
    return ethosProfile.displayName || ethosProfile.username || null;
  }, [recipientState.status, ethosProfile]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="New Chat"
      size="md"
      noPadding
      className={className}
    >
      <div className={styles.content}>
        <div className={styles.inputSection}>
          <Input
            ref={inputRef}
            size="lg"
            placeholder="Enter Ethereum address (0x...)"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            error={inputError}
            fullWidth
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Recipient Preview */}
        {recipientState.status === 'checking' && (
          <div className={styles.recipientCard}>
            <div className={styles.recipientLoading}>
              <Icon name="loader" size="md" />
              <span>Checking address...</span>
            </div>
          </div>
        )}

        {recipientState.status === 'valid' && (
          <div className={styles.recipientCard}>
            <div className={styles.recipientInfo}>
              <Avatar
                src={ethosProfile?.avatarUrl}
                address={recipientState.address}
                size="lg"
              />
              <div className={styles.recipientDetails}>
                {displayName && (
                  <span className={styles.recipientName}>{displayName}</span>
                )}
                <span className={styles.recipientAddress}>
                  {recipientState.address}
                </span>
              </div>
            </div>
            <div className={styles.statusList}>
              {recipientState.canMessage ? (
                <span className={styles.statusAvailable}>
                  <Icon name="check" size="sm" />
                  Available on Kusari
                </span>
              ) : (
                <span className={styles.statusUnavailable}>
                  <Icon name="alertTriangle" size="sm" />
                  Not available on Kusari
                </span>
              )}
            </div>
            <div className={styles.ethosSection}>
              {isEthosLoading ? (
                <span className={styles.statusLoading}>
                  <Icon name="loader" size="sm" />
                  Checking Ethos...
                </span>
              ) : ethosProfile ? (
                <>
                  <span className={styles.statusAvailable}>
                    <Icon name="check" size="sm" />
                    Registered on Ethos
                  </span>
                  <EthosBadgeGroup
                    score={ethosProfile.score}
                    level={ethosProfile.level}
                    positiveReviews={ethosProfile.reviews.positive}
                    neutralReviews={ethosProfile.reviews.neutral}
                    negativeReviews={ethosProfile.reviews.negative}
                    size="md"
                    className={styles.ethosStats}
                  />
                </>
              ) : (
                <span className={styles.statusUnavailable}>
                  <Icon name="alertTriangle" size="sm" />
                  Not registered on Ethos
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className={styles.actions}>
          <Button
            variant="primary"
            fullWidth
            disabled={!canStartChat}
            loading={isCreating}
            onClick={handleStartChat}
          >
            Start Chat
          </Button>
        </div>
      </div>
    </Modal>
  );
};
