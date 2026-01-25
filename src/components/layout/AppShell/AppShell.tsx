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

  // Hide nav and use fullscreen on chat detail pages (mobile only)
  const isChatDetail = pathname?.startsWith('/chat/') && pathname !== '/chat';
  const isFullscreen = isMobile && isChatDetail;

  return (
    <div className={styles.appShell}>
      {!isFullscreen && <MainNav items={navItems} logo={logo} />}
      <main className={`${styles.content} ${isFullscreen ? styles.fullscreen : ''}`}>
        {children}
      </main>
    </div>
  );
};
