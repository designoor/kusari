'use client';

import { WalletProvider } from '@/providers/WalletProvider';
import { XmtpProvider } from '@/providers/XmtpProvider';
import { ToastProvider } from '@/providers/ToastProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WalletProvider>
      <XmtpProvider>
        <ToastProvider>{children}</ToastProvider>
      </XmtpProvider>
    </WalletProvider>
  );
}
