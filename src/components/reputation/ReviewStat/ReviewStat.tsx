import React from 'react';
import { ThumbsUpIcon, ThumbsDownIcon, MinusIcon } from '@/components/ui/Icon/icons';
import styles from './ReviewStat.module.css';

export type ReviewStatVariant = 'positive' | 'negative' | 'neutral';
export type ReviewStatSize = 'sm' | 'md' | 'lg';

export interface ReviewStatProps {
  /** The variant determines the icon and color */
  variant: ReviewStatVariant;
  /** The count to display */
  count: number;
  /** Size variant - matches ReputationBadge sizes */
  size?: ReviewStatSize;
  /** Additional CSS class */
  className?: string;
}

const ICON_SIZE_MAP: Record<ReviewStatSize, number> = {
  sm: 10,
  md: 12,
  lg: 16,
};

const ICON_MAP = {
  positive: ThumbsUpIcon,
  negative: ThumbsDownIcon,
  neutral: MinusIcon,
};

/**
 * ReviewStat displays a review count with an icon and tinted background.
 *
 * @example
 * ```tsx
 * <ReviewStat variant="positive" count={42} />
 * <ReviewStat variant="negative" count={3} size="sm" />
 * <ReviewStat variant="neutral" count={5} />
 * ```
 */
export const ReviewStat: React.FC<ReviewStatProps> = ({
  variant,
  count,
  size = 'md',
  className,
}) => {
  const Icon = ICON_MAP[variant];
  const iconSize = ICON_SIZE_MAP[size];

  return (
    <div className={[styles.stat, styles[variant], styles[size], className].filter(Boolean).join(' ')}>
      <Icon size={iconSize} />
      <span>{count}</span>
    </div>
  );
};
