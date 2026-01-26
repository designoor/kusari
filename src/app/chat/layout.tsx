'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Logo } from '@/components/ui/Logo';
import { ConversationListProvider } from '@/providers/ConversationListProvider';
import { useNavItems } from '@/hooks';

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const navItems = useNavItems();

  return (
    <AppShell navItems={navItems} logo={<Logo animated />}>
      {children}
    </AppShell>
  );
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ConversationListProvider>
        <ChatLayoutContent>{children}</ChatLayoutContent>
      </ConversationListProvider>
    </AuthGuard>
  );
}
