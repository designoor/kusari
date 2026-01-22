import React from 'react';
import { Badge } from '@/components/ui/Badge';

export interface NotificationBadgeProps {
  /** The count to display */
  count?: number;
  /** Maximum count to display before showing "99+" */
  maxCount?: number;
  /** Show as a dot instead of a count */
  dot?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * NotificationBadge is a specialized badge for notification counts.
 *
 * Uses the error (red) variant consistently across the app for:
 * - MainNav badge (contacts with pending requests)
 * - New requests section link badge
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  dot = false,
  className,
}) => {
  // Don't render if no count and not in dot mode
  if (!dot && (count === undefined || count === 0)) {
    return null;
  }

  return (
    <Badge
      variant="error"
      size="sm"
      count={dot ? undefined : count}
      maxCount={maxCount}
      dot={dot}
      className={className}
    />
  );
};
