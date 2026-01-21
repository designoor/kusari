'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  // Hide mobile nav on chat detail pages (full-screen chat experience)
  const isChatDetail = pathname?.startsWith('/chat/') && pathname !== '/chat';
  const hideNav = isMobile && isChatDetail;

  return (
    <div className={styles.appShell}>
      {!hideNav && (
        <MainNav
          items={navItems}
          orientation={isMobile ? 'horizontal' : 'vertical'}
          logo={!isMobile ? logo : undefined}
        />
      )}
      <main className={`${styles.content} ${hideNav ? styles.fullscreen : isMobile ? styles.mobile : styles.desktop}`}>
        {children}
      </main>
    </div>
  );
};
