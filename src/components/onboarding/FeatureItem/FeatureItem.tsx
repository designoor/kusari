import React from 'react';
import styles from './FeatureItem.module.css';

export interface FeatureItemProps {
  /** Icon to display */
  icon: React.ReactNode;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Custom icon color (defaults to accent green) */
  iconColor?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Reusable feature item for onboarding steps
 * Displays an icon with title and description
 */
export const FeatureItem: React.FC<FeatureItemProps> = ({
  icon,
  title,
  description,
  iconColor,
  className,
}) => {
  return (
    <div className={`${styles.feature} ${className ?? ''}`}>
      <span className={styles.icon} style={iconColor ? { color: iconColor } : undefined}>
        {icon}
      </span>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
};
