'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConsentState } from '@xmtp/browser-sdk';
import { useXmtpContext } from './XmtpProvider';
import { usePreferencesContext } from './PreferencesProvider';
import { useConversationData } from './ConversationDataProvider';
import { useActiveConversation } from './ActiveConversationProvider';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { useLatest } from '@/hooks/useLatest';
import { streamAllMessages } from '@/services/xmtp/messages';
import {
  showNotification,
  getNotificationPermissionState,
} from '@/lib/notifications';
import { truncateAddress } from '@/lib';

/**
 * Provider that handles browser notifications for incoming messages.
 *
 * Shows notifications when:
 * - Notifications are enabled in preferences
 * - Browser permission is granted
 * - Message is from an allowed contact (or unknown if notifyForRequests is enabled)
 * - User is not viewing the conversation (tab hidden or different conversation open)
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { client, isInitialized } = useXmtpContext();
  const {
    notificationsEnabled,
    notifyForRequests,
    hideMessagePreviews,
  } = usePreferencesContext();
  const { previews } = useConversationData();
  const { activeConversationId } = useActiveConversation();
  const { isVisible } = usePageVisibility();

  // Use refs to access latest values in the streaming callback without re-subscribing
  const previewsRef = useLatest(previews);
  const activeConversationIdRef = useLatest(activeConversationId);
  const isVisibleRef = useLatest(isVisible);
  const notificationsEnabledRef = useLatest(notificationsEnabled);
  const notifyForRequestsRef = useLatest(notifyForRequests);
  const hideMessagePreviewsRef = useLatest(hideMessagePreviews);

  // Subscribe to message stream for notifications
  useEffect(() => {
    if (!client || !isInitialized) {
      return;
    }

    const cleanup = streamAllMessages(client, (message) => {
      // Check if notifications are enabled
      if (!notificationsEnabledRef.current) {
        return;
      }

      // Check browser permission
      if (getNotificationPermissionState() !== 'granted') {
        return;
      }

      // Only notify for text messages
      if (typeof message.content !== 'string') {
        return;
      }

      // Only notify for incoming messages (not from current user)
      if (message.senderInboxId === client.inboxId) {
        return;
      }

      // Get conversation preview for consent state and sender info
      const preview = previewsRef.current.get(message.conversationId);
      if (!preview) {
        return;
      }

      // Check consent state
      const isAllowed = preview.consentState === ConsentState.Allowed;
      const isUnknown = preview.consentState === ConsentState.Unknown;

      if (!isAllowed && !(isUnknown && notifyForRequestsRef.current)) {
        return;
      }

      // Don't notify if user is viewing this conversation and tab is focused
      if (isVisibleRef.current && activeConversationIdRef.current === message.conversationId) {
        return;
      }

      // Build notification content
      const title = preview.peerAddress
        ? truncateAddress(preview.peerAddress, 6, 4)
        : 'New Message';

      const body = hideMessagePreviewsRef.current
        ? 'New message received'
        : (message.content as string);

      // Show notification
      showNotification({
        title,
        body,
        icon: '/icons/icon-192x192.png',
        tag: `kusari-${message.conversationId}`,
        onClick: () => {
          // Focus the window and navigate to the conversation
          window.focus();
          router.push(`/chat/${message.conversationId}`);
        },
      });
    });

    return cleanup;
  }, [client, isInitialized, router]);

  return <>{children}</>;
}
