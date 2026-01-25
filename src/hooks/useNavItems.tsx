'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useNewRequestsCount } from './useNewRequestsCount';
import { useAllowedConversations } from './useConversations';
import { useUnreadContext } from '@/providers/UnreadProvider';

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
  const { filteredPreviews } = useAllowedConversations();
  const { unreadCounts } = useUnreadContext();

  // Compute unread count only for allowed conversations
  const allowedUnreadCount = useMemo(() => {
    let total = 0;
    for (const preview of filteredPreviews) {
      total += unreadCounts.get(preview.id) ?? 0;
    }
    return total;
  }, [filteredPreviews, unreadCounts]);

  const navItems = useMemo(
    () => [
      {
        id: 'chat',
        label: 'Chat',
        href: '/chat',
        icon: <Icon name="chat" size="md" />,
        badge: allowedUnreadCount > 0 ? allowedUnreadCount : undefined,
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
    [newRequestsCount, allowedUnreadCount]
  );

  return navItems;
}
