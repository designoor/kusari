'use client';

import React from 'react';
import { MainNav, NavItemData } from '../MainNav';
import { useIsMobile } from '@/hooks/useMediaQuery';
import styles from './AppShell.module.css';

export interface AppShellProps {
  navItems: NavItemData[];
  logo?: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ navItems, logo, children }) => {
  const isMobile = useIsMobile();

  return (
    <div className={styles.appShell}>
      <MainNav
        items={navItems}
        orientation={isMobile ? 'horizontal' : 'vertical'}
        logo={!isMobile ? logo : undefined}
      />
      <main className={`${styles.content} ${isMobile ? styles.mobile : styles.desktop}`}>
        {children}
      </main>
    </div>
  );
};
