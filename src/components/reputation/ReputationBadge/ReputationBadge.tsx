'use client';

import React from 'react';
import type { EthosScoreLevel } from '@/services/ethos';
import { EthosIcon } from '@/components/ui/Icon/icons';
import styles from './ReputationBadge.module.css';

export type ReputationBadgeSize = 'sm' | 'md' | 'lg';
export type ReputationBadgeVariant = 'full' | 'compact' | 'score-only';

export interface ReputationBadgeProps {
  /** The numeric reputation score (e.g., 1250) */
  score?: number | null;
  /** The score level from Ethos (determines color) */
  level?: EthosScoreLevel | null;
  /** Size variant */
  size?: ReputationBadgeSize;
  /** Display variant: full shows level + score, compact shows just score, score-only shows only the number */
  variant?: ReputationBadgeVariant;
  /** Whether the profile is verified (has Ethos profile) */
  verified?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Click handler for opening profile */
  onClick?: () => void;
}

/**
 * Maps score levels to display names
 */
const levelDisplayNames: Record<EthosScoreLevel, string> = {
  untrusted: 'Untrusted',
  questionable: 'Questionable',
  neutral: 'Neutral',
  known: 'Known',
  established: 'Established',
  reputable: 'Reputable',
  exemplary: 'Exemplary',
  distinguished: 'Distinguished',
  revered: 'Revered',
  renowned: 'Renowned',
};

/**
 * ReputationBadge displays an Ethos reputation score with color-coded styling.
 *
 * Each level has a distinct color matching the Ethos score gauge:
 * - Untrusted: Red
 * - Questionable: Orange/Gold
 * - Neutral: Tan/Beige
 * - Known: Olive Green
 * - Established: Light Blue
 * - Reputable: Blue
 * - Exemplary: Dark Blue
 * - Distinguished: Purple
 * - Revered: Violet
 * - Renowned: Magenta/Pink
 */
export const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  score,
  level,
  size = 'md',
  variant = 'full',
  verified = true,
  className,
  onClick,
}) => {
  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 10;
      case 'lg':
        return 16;
      default:
        return 12;
    }
  };

  // If not verified or no score data, show "No reputation" badge
  if (!verified || score === null || score === undefined || !level) {
    return (
      <span
        className={`${styles.badge} ${styles.unverified} ${styles[size]} ${className ?? ''}`}
        role="status"
        aria-label="No reputation on Ethos"
      >
        <EthosIcon size={getIconSize()} className={styles.icon} />
        <span className={styles.separator}>·</span>
        <span className={styles.noReputationLabel}>No reputation</span>
      </span>
    );
  }

  const displayName = levelDisplayNames[level];

  const handleClick = onClick
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
      }
    : undefined;

  const handleKeyDown = onClick
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }
    : undefined;

  const badgeContent = () => {
    const icon = <EthosIcon size={getIconSize()} className={styles.icon} />;

    switch (variant) {
      case 'score-only':
        return (
          <>
            {icon}
            <span className={styles.separator}>·</span>
            <span className={styles.score}>{score.toLocaleString()}</span>
          </>
        );
      case 'compact':
        return (
          <>
            {icon}
            <span className={styles.separator}>·</span>
            <span className={styles.score}>{score.toLocaleString()}</span>
          </>
        );
      case 'full':
      default:
        return (
          <>
            {icon}
            <span className={styles.separator}>·</span>
            <span className={styles.level}>{displayName}</span>
            <span className={styles.separator}>·</span>
            <span className={styles.score}>{score.toLocaleString()}</span>
          </>
        );
    }
  };

  return (
    <span
      className={`${styles.badge} ${styles[level]} ${styles[size]} ${styles[variant]} ${onClick ? styles.clickable : ''} ${className ?? ''}`}
      role="status"
      aria-label={`Ethos score: ${score}, level: ${displayName}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
    >
      {badgeContent()}
    </span>
  );
};
