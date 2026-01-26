'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NavItem, NavItemData } from './NavItem';
import styles from './MainNav.module.css';

export interface MainNavProps {
  items: NavItemData[];
  logo?: React.ReactNode;
}

export const MainNav: React.FC<MainNavProps> = ({ items, logo }) => {
  const pathname = usePathname();

  // Determine active item based on pathname
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.mainNav} aria-label="Main navigation">
      {logo && <div className={styles.logo}>{logo}</div>}
      <ul className={styles.navList}>
        {items.map((item) => (
          <li key={item.id}>
            <NavItem item={item} isActive={isActive(item.href)} />
          </li>
        ))}
      </ul>
    </nav>
  );
};
