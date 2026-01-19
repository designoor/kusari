import React from 'react';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string | null;
  address?: string;
  size?: AvatarSize;
  className?: string;
}

// Generate consistent color from address
function getColorFromAddress(address: string): string {
  if (!address) return '#5bff8c';

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  // Convert to hue (0-360)
  const hue = Math.abs(hash % 360);

  // Use good saturation and lightness for dark backgrounds
  return `hsl(${hue}, 70%, 60%)`;
}

// Get initials from address (first 2 hex chars after 0x)
function getInitialsFromAddress(address: string): string {
  if (!address) return '??';

  // Remove 0x prefix if present
  const cleanAddress = address.toLowerCase().startsWith('0x')
    ? address.slice(2)
    : address;

  // Take first 2 characters
  return cleanAddress.slice(0, 2).toUpperCase();
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
