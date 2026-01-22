'use client';

import React from 'react';
import { useEthosScore } from '@/hooks/useEthosScore';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ReputationBadge,
  type ReputationBadgeSize,
  type ReputationBadgeVariant,
} from '../ReputationBadge';
import type { EthosProfile } from '@/services/ethos';
import styles from './EthosScore.module.css';

export interface EthosScoreProps {
  /** Ethereum address to fetch score for */
  address: string | null | undefined;
  /** Size variant */
  size?: ReputationBadgeSize;
  /** Display variant */
  variant?: ReputationBadgeVariant;
  /** Whether to show loading skeleton */
  showLoading?: boolean;
  /** Whether to show error state as unverified */
  showErrorAsUnverified?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Click handler - if provided, badge becomes clickable and opens Ethos profile */
  onProfileClick?: (profileUrl: string) => void;
  /** Pre-fetched Ethos profile (for batch optimization) */
  ethosProfile?: EthosProfile | null;
}

/**
 * EthosScore fetches and displays the Ethos reputation score for an address.
 *
 * This is a wrapper component that:
 * - Uses the useEthosScore hook to fetch data
 * - Shows loading skeleton while fetching
 * - Displays ReputationBadge with the fetched data
 * - Handles error states gracefully
 *
 * @example
 * ```tsx
 * // Basic usage
 * <EthosScore address="0x1234..." />
 *
 * // With click handler to open profile
 * <EthosScore
 *   address={userAddress}
 *   onProfileClick={(url) => window.open(url, '_blank')}
 * />
 *
 * // Compact variant for lists
 * <EthosScore address={address} variant="compact" size="sm" />
 * ```
 */
export const EthosScore: React.FC<EthosScoreProps> = ({
  address,
  size = 'md',
  variant = 'full',
  showLoading = true,
  showErrorAsUnverified = true,
  className,
  onProfileClick,
  ethosProfile: externalProfile,
}) => {
  // Only fetch if no external profile is provided
  const { data: fetchedData, isLoading, error } = useEthosScore(
    externalProfile !== undefined ? null : address
  );
  const data = externalProfile ?? fetchedData;

  // Loading state
  if (isLoading && showLoading) {
    return (
      <span className={`${styles.loading} ${className ?? ''}`}>
        <Skeleton
          variant="rectangular"
          width={variant === 'full' ? 110 : variant === 'compact' ? 65 : 50}
          height={size === 'sm' ? 18 : size === 'lg' ? 30 : 24}
          className={styles.skeleton}
        />
      </span>
    );
  }

  // Error state - show as unverified
  if (error && showErrorAsUnverified) {
    return (
      <ReputationBadge
        verified={false}
        size={size}
        variant={variant}
        className={className}
      />
    );
  }

  // No data - show as unverified
  if (!data) {
    return (
      <ReputationBadge
        verified={false}
        size={size}
        variant={variant}
        className={className}
      />
    );
  }

  // Handle click to open Ethos profile
  const handleClick = onProfileClick
    ? () => onProfileClick(data.profileUrl)
    : undefined;

  return (
    <ReputationBadge
      score={data.score}
      level={data.level}
      size={size}
      variant={variant}
      verified={true}
      className={className}
      onClick={handleClick}
    />
  );
};
