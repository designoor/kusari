'use client';

import React, { useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Icon } from '@/components/ui/Icon';
import { useNewRequestsCount } from '@/hooks/useNewRequestsCount';
import styles from './layout.module.css';

const Logo = () => <div className={styles.logo}>K</div>;

function ChatLayoutContent({ children }: { children: React.ReactNode }) {
  const { count: newRequestsCount } = useNewRequestsCount();

  const navItems = useMemo(
    () => [
      {
        id: 'chat',
        label: 'Chat',
        href: '/chat',
        icon: <Icon name="chat" size="md" />,
      },
      {
        id: 'contacts',
        label: 'Contacts',
        href: '/contacts',
        icon: <Icon name="contacts" size="md" />,
        badge: newRequestsCount > 0 ? newRequestsCount : undefined,
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: <Icon name="settings" size="md" />,
      },
    ],
    [newRequestsCount]
  );

  return (
    <AppShell navItems={navItems} logo={<Logo />}>
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
      <ChatLayoutContent>{children}</ChatLayoutContent>
    </AuthGuard>
  );
}
