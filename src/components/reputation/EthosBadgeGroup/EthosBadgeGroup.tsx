import React from 'react';
import type { EthosScoreLevel } from '@/services/ethos';
import { ReputationBadge, type ReputationBadgeSize } from '../ReputationBadge';
import { ReviewStat } from '../ReviewStat';
import styles from './EthosBadgeGroup.module.css';

export interface EthosBadgeGroupProps {
  /** The numeric reputation score */
  score: number;
  /** The score level from Ethos */
  level: EthosScoreLevel;
  /** Number of positive reviews */
  positiveReviews: number;
  /** Number of neutral reviews */
  neutralReviews: number;
  /** Number of negative reviews */
  negativeReviews: number;
  /** Size variant - applies to all badges */
  size?: ReputationBadgeSize;
  /** Additional CSS class */
  className?: string;
}

/**
 * EthosBadgeGroup displays the reputation score badge alongside positive, neutral,
 * and negative review badges, tightly packed together.
 *
 * @example
 * ```tsx
 * <EthosBadgeGroup
 *   score={1250}
 *   level="reputable"
 *   positiveReviews={42}
 *   neutralReviews={5}
 *   negativeReviews={3}
 *   size="md"
 * />
 * ```
 */
export const EthosBadgeGroup: React.FC<EthosBadgeGroupProps> = ({
  score,
  level,
  positiveReviews,
  neutralReviews,
  negativeReviews,
  size = 'md',
  className,
}) => {
  return (
    <div className={[styles.group, className].filter(Boolean).join(' ')}>
      <ReputationBadge
        score={score}
        level={level}
        size={size}
        variant="full"
      />
      <ReviewStat variant="positive" count={positiveReviews} size={size} />
      <ReviewStat variant="neutral" count={neutralReviews} size={size} />
      <ReviewStat variant="negative" count={negativeReviews} size={size} />
    </div>
  );
};
