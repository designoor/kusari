import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'accent';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  count?: number;
  maxCount?: number;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  count,
  maxCount = 99,
  dot = false,
  className,
}) => {
  // If dot mode, just show a dot
  if (dot) {
    return (
      <span
        className={`${styles.badge} ${styles.dot} ${styles[variant]} ${styles[size]} ${className ?? ''}`}
        aria-label="Notification indicator"
      />
    );
  }

  // If no count provided, don't render
  if (count === undefined || count === null) {
    return null;
  }

  // Don't show badge if count is 0
  if (count === 0) {
    return null;
  }

  // Format count with max
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <span
      className={`${styles.badge} ${styles.count} ${styles[variant]} ${styles[size]} ${className ?? ''}`}
      aria-label={`${count} notification${count !== 1 ? 's' : ''}`}
    >
      {displayCount}
    </span>
  );
};
