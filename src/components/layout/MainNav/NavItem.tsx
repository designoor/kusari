import React from 'react';
import Link from 'next/link';
import { NotificationBadge } from '@/components/ui';
import styles from './MainNav.module.css';

export interface NavItemData {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

interface NavItemProps {
  item: NavItemData;
  isActive: boolean;
  orientation: 'vertical' | 'horizontal';
}

export const NavItem: React.FC<NavItemProps> = ({ item, isActive, orientation }) => {
  return (
    <Link
      href={item.href}
      className={`${styles.navItem} ${isActive ? styles.active : ''} ${styles[orientation]}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={styles.iconWrapper}>
        {item.icon}
        {item.badge !== undefined && item.badge > 0 && (
          <span className={styles.badge}>
            <NotificationBadge count={item.badge} />
          </span>
        )}
      </span>
      {orientation === 'vertical' && (
        <span className={styles.label}>{item.label}</span>
      )}
    </Link>
  );
};
