'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ConversationList } from '@/components/chat/ConversationList';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { DropdownMenu, type DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { EthosScore } from '@/components/reputation/EthosScore';
import { BanIcon, InboxIcon } from '@/components/ui/Icon/icons';
import { useMessages } from '@/hooks/useMessages';
import { useAllowedConversations } from '@/hooks/useConversations';
import { useEthosScore } from '@/hooks/useEthosScore';
import { useInboxConsent, useConsent } from '@/hooks/useConsent';
import { ConsentState } from '@xmtp/browser-sdk';
import { useXmtpContext } from '@/providers/XmtpProvider';
import { useToast } from '@/providers/ToastProvider';
import { getConversationById, isDm } from '@/services/xmtp/conversations';
import { getAddressForInboxId } from '@/services/xmtp/identity';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useNewChatModal } from '@/providers/NewChatModalProvider';
import { truncateAddress } from '@/lib';
import type { Conversation } from '@/types/conversation';
import styles from './conversation.module.css';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const isMobile = useIsMobile();
  const { client, isInitialized } = useXmtpContext();

  // Get conversation list for desktop sidebar
  const { filteredPreviews, isLoading: isLoadingConversations } = useAllowedConversations();
  const { openModal } = useNewChatModal();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [peerInboxId, setPeerInboxId] = useState<string | undefined>();
  const [peerAddress, setPeerAddress] = useState<string | undefined>();
  const [isLoadingConversation, setIsLoadingConversation] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const {
    messageGroups,
    isLoading: isLoadingMessages,
    sendMessage,
    isSending,
  } = useMessages(conversationId);

  // Consent management
  const { consentState, deny: denyContact } = useInboxConsent(peerInboxId ?? null);
  const { resetContact } = useConsent();
  const { showToast } = useToast();
  const [isConsentActionLoading, setIsConsentActionLoading] = useState(false);

  // Fetch Ethos profile for DMs
  const addressForEthos = peerAddress ?? peerInboxId;
  const { data: ethosProfile } = useEthosScore(addressForEthos);

  // Compute primary name for display
  const primaryName = useMemo(() => {
    if (conversation && !isDm(conversation)) {
      return conversation.name ?? 'Group Chat';
    }
    const ethosUsername = ethosProfile?.username || ethosProfile?.displayName;
    if (ethosUsername) {
      return ethosUsername;
    }
    if (peerAddress) {
      return truncateAddress(peerAddress);
    }
    if (peerInboxId) {
      return truncateAddress(peerInboxId);
    }
    return 'Unknown';
  }, [conversation, ethosProfile, peerAddress, peerInboxId]);

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
          // Resolve inbox ID to Ethereum address for display
          if (peerId) {
            const address = await getAddressForInboxId(client, peerId);
            setPeerAddress(address ?? undefined);
          }
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

  const handleNewConversation = useCallback(() => {
    router.push('/contacts');
  }, [router]);

  // Contact actions handlers
  const handleBlockContact = useCallback(async () => {
    if (!peerInboxId) return;
    setIsConsentActionLoading(true);
    try {
      await denyContact();
      showToast('Contact blocked', 'success');
      router.push('/chat');
    } catch {
      showToast('Failed to block contact', 'error');
    } finally {
      setIsConsentActionLoading(false);
    }
  }, [peerInboxId, denyContact, showToast, router]);

  const handleMoveToRequests = useCallback(async () => {
    if (!peerInboxId) return;
    setIsConsentActionLoading(true);
    try {
      await resetContact(peerInboxId);
      showToast('Moved to requests', 'success');
      router.push('/chat');
    } catch {
      showToast('Failed to move to requests', 'error');
    } finally {
      setIsConsentActionLoading(false);
    }
  }, [peerInboxId, resetContact, showToast, router]);

  // Build dropdown menu items for contact actions (only for allowed contacts in DMs)
  const contactMenuItems: DropdownMenuItem[] = useMemo(
    () => [
      {
        id: 'move-to-requests',
        label: isConsentActionLoading ? 'Moving...' : 'Move to Requests',
        icon: <InboxIcon size={16} />,
        onClick: () => void handleMoveToRequests(),
        disabled: isConsentActionLoading,
      },
      {
        id: 'block',
        label: isConsentActionLoading ? 'Blocking...' : 'Block Contact',
        icon: <BanIcon size={16} />,
        onClick: () => void handleBlockContact(),
        danger: true,
        disabled: isConsentActionLoading,
      },
    ],
    [handleBlockContact, handleMoveToRequests, isConsentActionLoading]
  );

  // Show dropdown only for allowed DM contacts
  const showContactMenu = conversation && isDm(conversation) && peerInboxId && consentState === ConsentState.Allowed;

  // Render conversation panel content
  const renderConversationPanel = () => {
    // Loading state
    if (isLoadingConversation) {
      return (
        <div className={styles.conversationPanel}>
          <PageHeader
            title="Loading..."
            backButton={isMobile ? { href: '/chat', mobileOnly: true } : undefined}
            size="lg"
            isLoading
          />
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
        <PageHeader
          title={primaryName}
          subtitle={conversationIsDm && peerAddress ? peerAddress : undefined}
          avatar={conversationIsDm ? { address: peerAddress ?? peerInboxId } : undefined}
          badge={conversationIsDm && peerAddress ? <EthosScore address={peerAddress} size="sm" variant="compact" /> : undefined}
          backButton={isMobile ? { href: '/chat', mobileOnly: true } : undefined}
          actionsElement={showContactMenu ? <DropdownMenu items={contactMenuItems} ariaLabel="Contact options" /> : undefined}
          size="lg"
          overlay
        />
        <div className={styles.messagesArea}>
          <MessageList
            messageGroups={messageGroups}
            isLoading={isLoadingMessages}
            emptyStateTitle="No messages yet"
            emptyStateDescription="Send a message to start the conversation"
          />
        </div>
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
        <PageHeader
          title="Messages"
          size="lg"
          actions={[{
            label: 'New',
            onClick: openModal,
            variant: 'ghost',
            icon: <Icon name="plus" size="sm" />
          }]}
        />
        <ConversationList
          conversations={filteredPreviews}
          isLoading={isLoadingConversations}
          activeConversationId={conversationId}
          emptyStateTitle="No conversations yet"
          emptyStateDescription="Find contacts to start a new conversation"
          emptyStateAction={{
            label: 'Find contacts',
            onClick: handleNewConversation,
          }}
        />
      </div>
      <div className={styles.main}>{renderConversationPanel()}</div>
    </div>
  );
}
