'use client';

import React from 'react';
import { useEthosScore } from '@/hooks/useEthosScore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ReputationBadge } from '../ReputationBadge';
import type { EthosProfile } from '@/services/ethos';
import styles from './EthosReputationPanel.module.css';

export interface EthosReputationPanelProps {
  /** Ethereum address to display reputation for */
  address: string;
  /** Whether to show the user's avatar and display name */
  showUserInfo?: boolean;
  /** Whether to show the vouch stats section */
  showVouches?: boolean;
  /** Whether to show the review stats section */
  showReviews?: boolean;
  /** Whether to show the "View on Ethos" link */
  showProfileLink?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Icon components for review stats
 */
const ThumbsUpIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const ThumbsDownIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
);

const MinusIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ExternalLinkIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/**
 * Loading skeleton for the panel
 */
const PanelSkeleton: React.FC<{
  showUserInfo: boolean;
  showReviews: boolean;
  showVouches: boolean;
}> = ({ showUserInfo, showReviews, showVouches }) => (
  <div className={styles.panel}>
    {showUserInfo && (
      <div className={styles.userInfo}>
        <Skeleton variant="circular" width={48} height={48} />
        <div className={styles.userDetails}>
          <Skeleton variant="text" width={120} height={18} />
          <Skeleton variant="rectangular" width={100} height={24} />
        </div>
      </div>
    )}
    {!showUserInfo && (
      <div className={styles.scoreOnly}>
        <Skeleton variant="rectangular" width={120} height={28} />
      </div>
    )}
    {showReviews && (
      <div className={styles.section}>
        <Skeleton variant="text" width={60} height={14} />
        <div className={styles.statsRow}>
          <Skeleton variant="rectangular" width={50} height={20} />
          <Skeleton variant="rectangular" width={50} height={20} />
          <Skeleton variant="rectangular" width={50} height={20} />
        </div>
      </div>
    )}
    {showVouches && (
      <div className={styles.section}>
        <Skeleton variant="text" width={50} height={14} />
        <div className={styles.statsRow}>
          <Skeleton variant="rectangular" width={80} height={20} />
          <Skeleton variant="rectangular" width={80} height={20} />
        </div>
      </div>
    )}
  </div>
);

/**
 * Unverified state display
 */
const UnverifiedPanel: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`${styles.panel} ${styles.unverified} ${className ?? ''}`}>
    <div className={styles.unverifiedContent}>
      <ReputationBadge verified={false} size="lg" />
      <p className={styles.unverifiedText}>
        This address has no Ethos profile. Exercise caution when interacting with
        unverified users.
      </p>
    </div>
  </div>
);

/**
 * Profile content display
 */
const ProfileContent: React.FC<{
  profile: EthosProfile;
  address: string;
  showUserInfo: boolean;
  showReviews: boolean;
  showVouches: boolean;
  showProfileLink: boolean;
}> = ({ profile, address, showUserInfo, showReviews, showVouches, showProfileLink }) => {
  const totalReviews = profile.reviews.positive + profile.reviews.negative + profile.reviews.neutral;
  const totalVouches = profile.vouches.given + profile.vouches.received;

  const handleOpenProfile = () => {
    window.open(profile.profileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {showUserInfo ? (
        <div className={styles.userInfo}>
          <Avatar
            src={profile.avatarUrl}
            address={address}
            size="lg"
          />
          <div className={styles.userDetails}>
            <span className={styles.displayName}>
              {profile.displayName || profile.username || 'Anonymous'}
            </span>
            <ReputationBadge
              score={profile.score}
              level={profile.level}
              size="md"
              variant="full"
            />
          </div>
        </div>
      ) : (
        <div className={styles.scoreOnly}>
          <ReputationBadge
            score={profile.score}
            level={profile.level}
            size="lg"
            variant="full"
          />
        </div>
      )}

      {showReviews && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>
            Reviews ({totalReviews})
          </span>
          <div className={styles.statsRow}>
            <div className={`${styles.stat} ${styles.positive}`}>
              <ThumbsUpIcon size={14} />
              <span>{profile.reviews.positive}</span>
            </div>
            <div className={`${styles.stat} ${styles.negative}`}>
              <ThumbsDownIcon size={14} />
              <span>{profile.reviews.negative}</span>
            </div>
            <div className={`${styles.stat} ${styles.neutral}`}>
              <MinusIcon size={14} />
              <span>{profile.reviews.neutral}</span>
            </div>
          </div>
        </div>
      )}

      {showVouches && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>
            Vouches ({totalVouches})
          </span>
          <div className={styles.statsRow}>
            <div className={styles.vouchStat}>
              <span className={styles.vouchLabel}>Received</span>
              <span className={styles.vouchValue}>{profile.vouches.received}</span>
            </div>
            <div className={styles.vouchStat}>
              <span className={styles.vouchLabel}>Given</span>
              <span className={styles.vouchValue}>{profile.vouches.given}</span>
            </div>
          </div>
        </div>
      )}

      {showProfileLink && (
        <div className={styles.profileLink}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenProfile}
          >
            <span>View on Ethos</span>
            <ExternalLinkIcon size={14} />
          </Button>
        </div>
      )}
    </>
  );
};

/**
 * EthosReputationPanel displays detailed Ethos reputation information for an address.
 *
 * Features:
 * - User info with avatar and display name
 * - Score badge with level indicator
 * - Review breakdown (positive/negative/neutral)
 * - Vouch counts (given/received)
 * - Link to Ethos profile
 *
 * @example
 * ```tsx
 * // Full panel with all sections
 * <EthosReputationPanel address="0x1234..." />
 *
 * // Minimal panel with just score
 * <EthosReputationPanel
 *   address={address}
 *   showUserInfo={false}
 *   showVouches={false}
 *   showReviews={false}
 * />
 *
 * // Panel for request review (shows reviews, hides vouches)
 * <EthosReputationPanel
 *   address={senderAddress}
 *   showVouches={false}
 * />
 * ```
 */
export const EthosReputationPanel: React.FC<EthosReputationPanelProps> = ({
  address,
  showUserInfo = true,
  showVouches = true,
  showReviews = true,
  showProfileLink = true,
  className,
}) => {
  const { data, isLoading, error } = useEthosScore(address);

  if (isLoading) {
    return (
      <PanelSkeleton
        showUserInfo={showUserInfo}
        showReviews={showReviews}
        showVouches={showVouches}
      />
    );
  }

  if (error || !data) {
    return <UnverifiedPanel className={className} />;
  }

  return (
    <div className={`${styles.panel} ${className ?? ''}`}>
      <ProfileContent
        profile={data}
        address={address}
        showUserInfo={showUserInfo}
        showReviews={showReviews}
        showVouches={showVouches}
        showProfileLink={showProfileLink}
      />
    </div>
  );
};
