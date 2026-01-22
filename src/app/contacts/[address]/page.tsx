'use client';

import { useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ConsentState } from '@xmtp/browser-sdk';
import { ContactDetail } from '@/components/contacts';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContactsIcon } from '@/components/ui/Icon/icons';
import { useConversations } from '@/hooks/useConversations';
import { identifiersMatch } from '@/lib';
import styles from './contact.module.css';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const address = decodeURIComponent(params.address as string);
  const conversationIdFromQuery = searchParams.get('conversation');

  const { filteredPreviews: allPreviews, isLoading } = useConversations();

  // Find the contact/conversation preview for this address
  // Uses identifiersMatch to handle hex addresses (case-insensitive) and other identifier formats
  // Matches by either peerAddress (Ethereum address) or peerInboxId (XMTP inbox ID)
  const contactPreview = useMemo(() => {
    return allPreviews.find(
      (preview) =>
        (preview.peerAddress != null && identifiersMatch(preview.peerAddress, address)) ||
        (preview.peerInboxId != null && identifiersMatch(preview.peerInboxId, address))
    );
  }, [allPreviews, address]);

  const conversationId = conversationIdFromQuery ?? contactPreview?.id;
  const consentState = contactPreview?.consentState ?? ConsentState.Unknown;
  const lastMessage = contactPreview?.lastMessage ?? undefined;

  // Determine back link based on consent state
  const getBackLink = () => {
    if (consentState === ConsentState.Unknown) {
      return '/contacts/requests';
    }
    if (consentState === ConsentState.Denied) {
      return '/contacts/denied';
    }
    return '/contacts';
  };

  // Handle consent change - redirect appropriately
  const handleConsentChange = useCallback(
    (newState: ConsentState) => {
      if (newState === ConsentState.Allowed && conversationId) {
        router.push(`/chat/${conversationId}`);
      } else if (newState === ConsentState.Denied) {
        router.push('/contacts');
      } else if (newState === ConsentState.Unknown) {
        // Redirect back to contacts (not requests) after moving to requests
        router.push('/contacts');
      }
    },
    [router, conversationId]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <PageHeader
          title="Connection Request"
          backButton={{ href: '/contacts' }}
          size="lg"
          isLoading
        />
        <div className={styles.content}>
          <div className={styles.loadingSkeleton}>
            <Skeleton variant="circular" width={80} height={80} />
            <Skeleton variant="text" width={150} height={24} />
            <Skeleton variant="text" width={200} height={16} />
            <Skeleton variant="rectangular" width="100%" height={120} />
          </div>
        </div>
      </div>
    );
  }

  // Not found - no conversation with this address, or missing required peerInboxId for DMs
  if (!contactPreview?.peerInboxId) {
    return (
      <div className={styles.container}>
        <PageHeader
          title="Connection Request"
          backButton={{ href: '/contacts' }}
          size="lg"
        />
        <div className={styles.content}>
          <EmptyState
            icon={<ContactsIcon size={48} />}
            title="Contact not found"
            description="This contact doesn't exist or hasn't messaged you yet"
            action={{
              label: 'Back to contacts',
              onClick: () => router.push('/contacts'),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Connection Request"
        backButton={{ href: getBackLink() }}
        size="lg"
      />
      <div className={styles.content}>
        <ContactDetail
          address={address}
          peerInboxId={contactPreview.peerInboxId}
          consentState={consentState}
          conversationId={conversationId}
          lastMessage={lastMessage}
          onConsentChange={handleConsentChange}
          showChatButton={consentState === ConsentState.Allowed}
        />
      </div>
    </div>
  );
}
