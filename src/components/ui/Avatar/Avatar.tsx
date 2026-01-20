import React from 'react';
import { getColorFromAddress, getInitialsFromAddress } from '@/lib';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  address?: string;
  size?: AvatarSize;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  address,
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const shouldShowImage = src && !imageError;

  const backgroundColor = address ? getColorFromAddress(address) : undefined;
  const initials = address ? getInitialsFromAddress(address) : '??';

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${className ?? ''}`}
      style={!shouldShowImage ? { backgroundColor } : undefined}
    >
      {shouldShowImage ? (
        <img
          src={src}
          alt=""
          className={styles.image}
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </div>
  );
};
