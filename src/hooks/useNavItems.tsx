'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useNewRequestsCount } from './useNewRequestsCount';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

/**
 * Hook that returns the main navigation items with dynamic badge counts.
 * Used by layouts that render the AppShell with navigation.
 */
export function useNavItems(): NavItem[] {
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

  return navItems;
}
