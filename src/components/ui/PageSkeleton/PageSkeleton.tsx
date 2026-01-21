import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import styles from './PageSkeleton.module.css';

export type PageSkeletonVariant = 'list' | 'detail' | 'chat' | 'custom';

export interface PageSkeletonProps {
  /** The type of page skeleton to display */
  variant?: PageSkeletonVariant;
  /** Number of list items to show (for list variant) */
  itemCount?: number;
  /** Show header skeleton */
  showHeader?: boolean;
  /** Custom children for custom variant */
  children?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * ListItemSkeleton - Reusable skeleton for list items (contacts, conversations)
 */
const ListItemSkeleton: React.FC<{ index: number }> = ({ index }) => (
  <div className={styles.listItem} style={{ animationDelay: `${index * 100}ms` }}>
    <Skeleton variant="circular" width={48} height={48} />
    <div className={styles.listItemContent}>
      <Skeleton variant="text" width="60%" height={16} />
      <Skeleton variant="text" width="40%" height={14} />
    </div>
  </div>
);

/**
 * HeaderSkeleton - Skeleton for page headers with back button
 */
const HeaderSkeleton: React.FC = () => (
  <div className={styles.header}>
    <Skeleton variant="text" width={80} height={20} />
    <Skeleton variant="text" width={200} height={28} />
    <Skeleton variant="text" width="80%" height={16} />
  </div>
);

/**
 * ChatSkeleton - Skeleton for chat conversation pages
 */
const ChatSkeleton: React.FC = () => (
  <div className={styles.chatContainer}>
    {/* Header skeleton */}
    <div className={styles.chatHeader}>
      <Skeleton variant="circular" width={40} height={40} />
      <div className={styles.chatHeaderContent}>
        <Skeleton variant="text" width={120} height={18} />
        <Skeleton variant="text" width={200} height={14} />
      </div>
    </div>
    {/* Messages skeleton */}
    <div className={styles.chatMessages}>
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={`${styles.messageSkeleton} ${index % 2 === 0 ? styles.left : styles.right}`}
        >
          <Skeleton variant="rectangular" width="60%" height={48} />
        </div>
      ))}
    </div>
    {/* Input skeleton */}
    <div className={styles.chatInput}>
      <Skeleton variant="rectangular" width="100%" height={48} />
    </div>
  </div>
);

/**
 * DetailSkeleton - Skeleton for detail pages (contact detail)
 */
const DetailSkeleton: React.FC = () => (
  <div className={styles.detailContainer}>
    <div className={styles.detailHeader}>
      <Skeleton variant="text" width={80} height={16} />
    </div>
    <div className={styles.detailContent}>
      <Skeleton variant="circular" width={80} height={80} />
      <Skeleton variant="text" width={150} height={24} />
      <Skeleton variant="text" width={200} height={16} />
      <Skeleton variant="rectangular" width="100%" height={120} />
      <Skeleton variant="rectangular" width="100%" height={48} />
    </div>
  </div>
);

/**
 * PageSkeleton provides consistent loading skeletons for different page types.
 *
 * Variants:
 * - `list`: List of items (contacts, conversations)
 * - `detail`: Detail page (contact detail)
 * - `chat`: Chat conversation page
 * - `custom`: Custom content via children
 */
export const PageSkeleton: React.FC<PageSkeletonProps> = ({
  variant = 'list',
  itemCount = 5,
  showHeader = false,
  children,
  className,
}) => {
  const containerClass = `${styles.container} ${className ?? ''}`;

  if (variant === 'custom' && children) {
    return <div className={containerClass}>{children}</div>;
  }

  if (variant === 'chat') {
    return (
      <div className={containerClass}>
        <ChatSkeleton />
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={containerClass}>
        <DetailSkeleton />
      </div>
    );
  }

  // Default: list variant
  return (
    <div className={containerClass}>
      {showHeader && <HeaderSkeleton />}
      <div className={styles.list}>
        {Array.from({ length: itemCount }).map((_, index) => (
          <ListItemSkeleton key={index} index={index} />
        ))}
      </div>
    </div>
  );
};
