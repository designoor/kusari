'use client';

import { WalletProvider } from '@/providers/WalletProvider';
import { XmtpProvider } from '@/providers/XmtpProvider';
import { UnreadProvider } from '@/providers/UnreadProvider';
import { ConversationDataProvider } from '@/providers/ConversationDataProvider';
import { ActiveConversationProvider } from '@/providers/ActiveConversationProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { NewChatModalProvider } from '@/providers/NewChatModalProvider';
import { PreferencesProvider } from '@/providers/PreferencesProvider';
import { NewChatModal } from '@/components/chat/NewChatModal';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Auth providers handle user identity and preferences.
 * Order: Preferences → Wallet → XMTP (each depends on the previous)
 */
function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <WalletProvider>
        <XmtpProvider>
          {children}
        </XmtpProvider>
      </WalletProvider>
    </PreferencesProvider>
  );
}

/**
 * Data providers manage conversation and messaging state.
 * Order: Unread → ConversationData → ActiveConversation
 * (Unread and ConversationData depend on XMTP from AuthProviders)
 */
function DataProviders({ children }: { children: React.ReactNode }) {
  return (
    <UnreadProvider>
      <ConversationDataProvider>
        <ActiveConversationProvider>
          {children}
        </ActiveConversationProvider>
      </ConversationDataProvider>
    </UnreadProvider>
  );
}

/**
 * UI providers handle notifications, toasts, and modals.
 * These are leaf providers that consume data from above.
 * NotificationProvider needs data providers, but Toast/NewChatModal are independent.
 */
function UIProviders({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <ToastProvider>
        <NewChatModalProvider>
          {children}
          <NewChatModal />
        </NewChatModalProvider>
      </ToastProvider>
    </NotificationProvider>
  );
}

/**
 * Root provider composition.
 *
 * Structure (3 logical groups):
 * - AuthProviders: Identity & preferences (Preferences → Wallet → XMTP)
 * - DataProviders: Messaging state (Unread → ConversationData → ActiveConversation)
 * - UIProviders: User interface (Notification → Toast → NewChatModal)
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProviders>
      <DataProviders>
        <UIProviders>
          {children}
        </UIProviders>
      </DataProviders>
    </AuthProviders>
  );
}
