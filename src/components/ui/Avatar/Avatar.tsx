import React, { useState, useCallback } from 'react';
import { getColorFromAddress, getInitialsFromAddress } from '@/lib';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  address?: string;
  size?: AvatarSize;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = React.memo(({
  src,
  address,
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = useState(false);
  const shouldShowImage = src && !imageError;

  const backgroundColor = address ? getColorFromAddress(address) : undefined;
  const initials = address ? getInitialsFromAddress(address) : '??';

  const handleError = useCallback(() => setImageError(true), []);

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
          loading="lazy"
          decoding="async"
          onError={handleError}
        />
      ) : (
        <span className={styles.initials}>{initials}</span>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';
