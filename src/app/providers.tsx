'use client';

import { WalletProvider } from '@/providers/WalletProvider';
import { XmtpProvider } from '@/providers/XmtpProvider';
import { UnreadProvider } from '@/providers/UnreadProvider';
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
            <ToastProvider>
              <NewChatModalProvider>
                {children}
                <NewChatModal />
              </NewChatModalProvider>
            </ToastProvider>
          </UnreadProvider>
        </XmtpProvider>
      </WalletProvider>
    </PreferencesProvider>
  );
}
