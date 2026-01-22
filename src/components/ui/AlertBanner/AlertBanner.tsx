import React from 'react';
import styles from './AlertBanner.module.css';

export type AlertBannerVariant = 'warning' | 'danger' | 'positive';

export interface AlertBannerProps {
  /** Visual variant */
  variant: AlertBannerVariant;
  /** Required title text */
  title: string;
  /** Optional icon to display */
  icon?: React.ReactNode;
  /** Optional content below the title */
  children?: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * AlertBanner displays contextual alerts with different severity levels.
 *
 * Variants:
 * - warning: Orange - for caution/attention
 * - danger: Red - for errors/critical warnings
 * - positive: Green - for success/safe states
 */
export const AlertBanner: React.FC<AlertBannerProps> = ({
  variant,
  title,
  icon,
  children,
  className,
}) => {
  return (
    <div className={[styles.banner, styles[variant], className].filter(Boolean).join(' ')}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {children && <div className={styles.body}>{children}</div>}
      </div>
    </div>
  );
};
