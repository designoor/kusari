import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { getColorFromAddress, getInitialsFromAddress } from '@/lib';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  address?: string;
  size?: AvatarSize;
  className?: string;
}

// Map size names to pixel dimensions (must match CSS)
const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 48,
};

export const Avatar: React.FC<AvatarProps> = React.memo(({
  src,
  address,
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const shouldShowImage = src && !imageError;

  const backgroundColor = address ? getColorFromAddress(address) : undefined;
  const initials = address ? getInitialsFromAddress(address) : '??';
  const pixelSize = SIZE_MAP[size];

  const handleError = useCallback(() => setImageError(true), []);
  const handleLoad = useCallback(() => setImageLoaded(true), []);

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${className ?? ''}`}
      style={{ backgroundColor }}
    >
      {/* Always render initials as fallback/placeholder */}
      <span className={`${styles.initials} ${shouldShowImage && imageLoaded ? styles.hidden : ''}`}>
        {initials}
      </span>
      {/* Render image on top, fades in when loaded */}
      {shouldShowImage && (
        <Image
          src={src}
          alt=""
          width={pixelSize}
          height={pixelSize}
          className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
          onError={handleError}
          onLoad={handleLoad}
          unoptimized={src.startsWith('data:')}
        />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';
