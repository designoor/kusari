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

export function Providers({ children }: ProvidersProps) {
  return (
    <PreferencesProvider>
      <WalletProvider>
        <XmtpProvider>
          <UnreadProvider>
            <ConversationDataProvider>
              <ActiveConversationProvider>
                <NotificationProvider>
                  <ToastProvider>
                    <NewChatModalProvider>
                      {children}
                      <NewChatModal />
                    </NewChatModalProvider>
                  </ToastProvider>
                </NotificationProvider>
              </ActiveConversationProvider>
            </ConversationDataProvider>
          </UnreadProvider>
        </XmtpProvider>
      </WalletProvider>
    </PreferencesProvider>
  );
}
