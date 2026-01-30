'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import { BanIcon, InboxIcon, ContactsIcon } from '@/components/ui/Icon/icons';
import { useMessages } from '@/hooks/useMessages';
import { useConversationList } from '@/providers/ConversationListProvider';
import { useEthosScore } from '@/hooks/useEthosScore';
import { useInboxConsent, useConsent } from '@/hooks/useConsent';
import { ConsentState } from '@xmtp/browser-sdk';
import { useXmtpContext } from '@/providers/XmtpProvider';
import { useToast } from '@/providers/ToastProvider';
import { getConversationById, isDm } from '@/services/xmtp/conversations';
import { getAddressForInboxId } from '@/services/xmtp/identity';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useNewChatModal } from '@/providers/NewChatModalProvider';
import { useActiveConversation } from '@/providers/ActiveConversationProvider';
import { truncateAddress } from '@/lib';
import type { Conversation } from '@/types/conversation';
import styles from './conversation.module.css';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const isMobile = useIsMobile();
  const { isKeyboardOpen, viewportOffset, viewportHeight, keyboardHeight } = useKeyboardHeight();
  const { client, isInitialized } = useXmtpContext();

  // Get conversation list for desktop sidebar with coordinated Ethos loading
  const { previews, ethosProfiles: sidebarEthosProfiles, isInitialLoading: isLoadingConversations } = useConversationList();
  const { openModal } = useNewChatModal();
  const { setActiveConversationId } = useActiveConversation();

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
  const toast = useToast();
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

  // Track active conversation for notification suppression
  useEffect(() => {
    setActiveConversationId(conversationId);
    return () => setActiveConversationId(null);
  }, [conversationId, setActiveConversationId]);

  // Ref for the container element to apply keyboard styles
  const containerRef = useRef<HTMLDivElement>(null);

  // Completely lock the document when keyboard is open on iOS
  // This prevents the rubber-band/jelly scroll effect
  useEffect(() => {
    if (!isMobile || !isKeyboardOpen) {
      return;
    }

    const html = document.documentElement;
    const body = document.body;
    const container = containerRef.current;

    // Lock html and body in place
    html.style.position = 'fixed';
    html.style.top = '0';
    html.style.left = '0';
    html.style.right = '0';
    html.style.bottom = '0';
    html.style.overflow = 'hidden';

    body.style.position = 'fixed';
    body.style.top = '0';
    body.style.left = '0';
    body.style.right = '0';
    body.style.bottom = '0';
    body.style.overflow = 'hidden';

    // Pin container to visual viewport
    if (container) {
      container.style.position = 'fixed';
      container.style.top = `${viewportOffset}px`;
      container.style.left = '0';
      container.style.right = '0';
      container.style.height = 'var(--visual-viewport-height)';
      container.style.overflow = 'hidden';
    }

    // Prevent touchmove on document (blocks rubber-band effect)
    // Allow scrolling only inside elements marked with data-scrollable
    const preventBounce = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const scrollableParent = target.closest('[data-scrollable]');

      if (!scrollableParent) {
        e.preventDefault();
        return;
      }

      // Check if the scrollable element is actually scrollable
      const el = scrollableParent as HTMLElement;
      const isAtTop = el.scrollTop <= 0;
      const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight;

      // If at bounds and trying to scroll further, prevent it
      const touch = e.touches[0];
      if (touch) {
        const startY = (e as TouchEvent & { startY?: number }).startY ?? touch.clientY;
        const deltaY = touch.clientY - startY;

        if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
          e.preventDefault();
        }
      }
    };

    // Track touch start position
    const trackTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        (e as TouchEvent & { startY?: number }).startY = touch.clientY;
      }
    };

    document.addEventListener('touchstart', trackTouchStart, { passive: true });
    document.addEventListener('touchmove', preventBounce, { passive: false });

    return () => {
      html.style.position = '';
      html.style.top = '';
      html.style.left = '';
      html.style.right = '';
      html.style.bottom = '';
      html.style.overflow = '';

      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.bottom = '';
      body.style.overflow = '';

      if (container) {
        container.style.position = '';
        container.style.top = '';
        container.style.left = '';
        container.style.right = '';
        container.style.height = '';
        container.style.overflow = '';
      }

      document.removeEventListener('touchstart', trackTouchStart);
      document.removeEventListener('touchmove', preventBounce);
    };
  }, [isMobile, isKeyboardOpen, viewportOffset]);

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  // Contact actions handlers
  const handleBlockContact = useCallback(async () => {
    if (!peerInboxId) return;
    setIsConsentActionLoading(true);
    try {
      await denyContact();
      toast.success('Contact blocked');
      router.push('/chat');
    } catch {
      toast.error('Failed to block contact');
    } finally {
      setIsConsentActionLoading(false);
    }
  }, [peerInboxId, denyContact, toast, router]);

  const handleMoveToRequests = useCallback(async () => {
    if (!peerInboxId) return;
    setIsConsentActionLoading(true);
    try {
      await resetContact(peerInboxId);
      toast.success('Moved to requests');
      router.push('/chat');
    } catch {
      toast.error('Failed to move to requests');
    } finally {
      setIsConsentActionLoading(false);
    }
  }, [peerInboxId, resetContact, toast, router]);

  const handleViewProfile = useCallback(() => {
    const address = peerAddress ?? peerInboxId;
    if (!address) return;
    router.push(`/contacts/${encodeURIComponent(address)}?conversation=${conversationId}`);
  }, [peerAddress, peerInboxId, conversationId, router]);

  // Build dropdown menu items for contact actions (only for allowed contacts in DMs)
  const contactMenuItems: DropdownMenuItem[] = useMemo(
    () => [
      {
        id: 'profile',
        label: 'Profile',
        icon: <ContactsIcon size={16} />,
        onClick: handleViewProfile,
      },
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
    [handleBlockContact, handleMoveToRequests, handleViewProfile, isConsentActionLoading]
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
          avatar={conversationIsDm ? { address: peerAddress ?? peerInboxId, src: ethosProfile?.avatarUrl } : undefined}
          badge={conversationIsDm && peerAddress ? <EthosScore address={peerAddress} profile={ethosProfile} size="sm" variant="compact" /> : undefined}
          backButton={isMobile ? { href: '/chat', mobileOnly: true } : undefined}
          actionsElement={showContactMenu ? <DropdownMenu items={contactMenuItems} ariaLabel="Contact options" /> : undefined}
          size="lg"
          overlay
        />
        <div className={styles.messagesArea} data-scrollable>
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

  // Mobile: Only show conversation panel (pinned to visual viewport via ref)
  if (isMobile) {
    return (
      <div ref={containerRef} className={styles.container}>
        {/* Debug indicator - remove after testing */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: isKeyboardOpen ? 'red' : 'green',
          color: 'white',
          padding: '4px 8px',
          fontSize: '10px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          KB: {isKeyboardOpen ? 'OPEN' : 'closed'} | H: {Math.round(viewportHeight)} | Off: {Math.round(viewportOffset)} | KBH: {keyboardHeight}
        </div>
        {renderConversationPanel()}
      </div>
    );
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
          conversations={previews}
          ethosProfiles={sidebarEthosProfiles}
          isLoading={isLoadingConversations}
          activeConversationId={conversationId}
          emptyStateTitle="No conversations yet"
          emptyStateDescription="Find contacts to start a new conversation"
          emptyStateAction={{
            label: 'Find contacts',
            onClick: openModal,
          }}
        />
      </div>
      <div className={styles.main}>{renderConversationPanel()}</div>
    </div>
  );
}
