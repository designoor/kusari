import React from 'react';
import { Badge, type BadgeSize } from '../Badge';

export interface NewBadgeProps {
  /** Count to display */
  count?: number;
  /** Size of the badge */
  size?: BadgeSize;
  /** Additional CSS class */
  className?: string;
}

/**
 * NewBadge is a specialized badge for indicating new items.
 * Uses a red (error) design to draw attention to new requests, messages, etc.
 */
export const NewBadge: React.FC<NewBadgeProps> = ({
  count,
  size = 'sm',
  className,
}) => {
  return (
    <Badge
      variant="error"
      size={size}
      count={count}
      className={className}
    />
  );
};
