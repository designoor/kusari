'use client';

import { WalletProvider } from '@/providers/WalletProvider';
import { XmtpProvider } from '@/providers/XmtpProvider';
import { EthosProvider } from '@/providers/EthosProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { NewChatModalProvider } from '@/providers/NewChatModalProvider';
import { NewChatModal } from '@/components/chat/NewChatModal';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WalletProvider>
      <XmtpProvider>
        <EthosProvider>
          <ToastProvider>
            <NewChatModalProvider>
              {children}
              <NewChatModal />
            </NewChatModalProvider>
          </ToastProvider>
        </EthosProvider>
      </XmtpProvider>
    </WalletProvider>
  );
}
