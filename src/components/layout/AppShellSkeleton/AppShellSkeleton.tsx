import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './AppShellSkeleton.module.css';

/**
 * App shell skeleton that mimics the actual app layout during loading.
 *
 * Uses CSS-only responsive handling to avoid hydration flash.
 *
 * Shows:
 * - MainNav skeleton (vertical on desktop, horizontal on mobile)
 * - Sidebar with page header skeleton, search input, and conversation list skeletons
 * - Empty main content area on desktop
 */
export const AppShellSkeleton: React.FC = () => {
  return (
    <div className={styles.shell}>
      {/* Navigation skeleton */}
      <nav className={styles.nav}>
        {/* Logo area (hidden on mobile via CSS) */}
        <div className={styles.logoArea}>
          <Skeleton variant="rectangular" width={32} height={32} />
        </div>

        {/* Nav items */}
        <div className={styles.navList}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.navItem}>
              <Skeleton variant="rectangular" width={24} height={24} />
              <Skeleton variant="text" width={40} height={12} />
            </div>
          ))}
        </div>
      </nav>

      {/* Main content area */}
      <main className={styles.content}>
        <div className={styles.container}>
          {/* Sidebar panel */}
          <div className={styles.sidebar}>
            {/* Page header skeleton */}
            <header className={styles.header}>
              <Skeleton variant="text" width={120} height={24} />
              <Skeleton variant="rectangular" width={32} height={32} />
            </header>

            {/* Search input skeleton */}
            <div className={styles.searchWrapper}>
              <div className={styles.searchInput}>
                <Skeleton variant="rectangular" width={16} height={16} />
                <Skeleton variant="text" width="70%" height={14} />
              </div>
            </div>

            {/* Conversation list skeleton */}
            <div className={styles.list}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={styles.listItem}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <div className={styles.listItemContent}>
                    <Skeleton variant="text" width="60%" height={16} />
                    <Skeleton variant="text" width="80%" height={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main area (hidden on mobile via CSS) */}
          <div className={styles.main} />
        </div>
      </main>
    </div>
  );
};
