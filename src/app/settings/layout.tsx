'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { Logo } from '@/components/ui/Logo';
import { useNavItems } from '@/hooks';

function SettingsLayoutContent({ children }: { children: React.ReactNode }) {
  const navItems = useNavItems();

  return (
    <AppShell navItems={navItems} logo={<Logo animated />}>
      {children}
    </AppShell>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </AuthGuard>
  );
}
