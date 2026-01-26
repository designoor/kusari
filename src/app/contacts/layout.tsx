'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Logo } from '@/components/ui/Logo';
import { useNavItems } from '@/hooks';

function ContactsLayoutContent({ children }: { children: React.ReactNode }) {
  const navItems = useNavItems();

  return (
    <AppShell navItems={navItems} logo={<Logo animated />}>
      {children}
    </AppShell>
  );
}

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ContactsLayoutContent>{children}</ContactsLayoutContent>
    </AuthGuard>
  );
}
