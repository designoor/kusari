'use client';

import React from 'react';
import { useEthosScore } from '@/hooks/useEthosScore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ExternalLinkIcon } from '@/components/ui/Icon/icons';
import { ReputationBadge } from '../ReputationBadge';
import { ReviewStat } from '../ReviewStat';
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
  const totalReviews = profile.reviews.positive + profile.reviews.negative;
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
        <div className={styles.section}>
          <span className={styles.sectionLabel}>
            Score
          </span>
          <div className={styles.statsRow}>
            <ReputationBadge
              score={profile.score}
              level={profile.level}
              size="lg"
              variant="full"
            />
          </div>
        </div>
      )}

      {showReviews && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>
            Reviews ({totalReviews})
          </span>
          <div className={styles.statsRow}>
            <ReviewStat variant="positive" count={profile.reviews.positive} />
            <ReviewStat variant="negative" count={profile.reviews.negative} />
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
            variant="secondary"
            fullWidth
            size="sm"
            onClick={handleOpenProfile}
            rightIcon={<ExternalLinkIcon size={14} />}
          >
            View on Ethos
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
export const EthosReputationPanel: React.FC<EthosReputationPanelProps> = React.memo(({
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
});

EthosReputationPanel.displayName = 'EthosReputationPanel';
