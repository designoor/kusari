'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Icon } from '@/components/ui/Icon';
import styles from './layout.module.css';

const navItems = [
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
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: <Icon name="settings" size="md" />,
  },
];

const Logo = () => <div className={styles.logo}>K</div>;

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell navItems={navItems} logo={<Logo />}>
      {children}
    </AppShell>
  );
}
