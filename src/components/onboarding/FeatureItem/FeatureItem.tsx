import React from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import styles from './FeatureItem.module.css';

export interface FeatureItemProps {
  icon: IconName;
  title: string;
  description: string;
  color?: string;
}

/**
 * Reusable feature item for onboarding steps
 * Displays an icon with title and description
 */
export const FeatureItem: React.FC<FeatureItemProps> = ({
  icon,
  title,
  description,
  color,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper} style={color ? { color } : undefined}>
        <Icon name={icon} size="md" />
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
};
