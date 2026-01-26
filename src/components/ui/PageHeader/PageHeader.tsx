'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, type AvatarSize } from '../Avatar';
import { Button, type ButtonVariant, type ButtonSize } from '../Button';
import { Icon } from '../Icon';
import { Skeleton } from '../Skeleton';
import styles from './PageHeader.module.css';

export type PageHeaderSize = 'sm' | 'md' | 'lg';

export interface PageHeaderBackButton {
  href: string;
  onClick?: () => void;
  mobileOnly?: boolean;
}

export interface PageHeaderAvatar {
  address?: string;
  src?: string;
  size?: AvatarSize;
}

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  avatar?: PageHeaderAvatar;
  badge?: React.ReactNode;
  backButton?: PageHeaderBackButton;
  /** Array of button actions */
  actions?: PageHeaderAction[];
  /** Custom actions element (alternative to actions array, e.g., for dropdown menus) */
  actionsElement?: React.ReactNode;
  size?: PageHeaderSize;
  /** Overlay mode: positions header absolutely over content for blur effect */
  overlay?: boolean;
  isLoading?: boolean;
  className?: string;
}

const PageHeaderSkeleton: React.FC<{
  hasBackButton?: boolean;
  hasAvatar?: boolean;
  hasSubtitle?: boolean;
  hasBadge?: boolean;
  hasActions?: boolean;
  size?: PageHeaderSize;
  overlay?: boolean;
  className?: string;
}> = ({
  hasBackButton,
  hasAvatar,
  hasSubtitle,
  hasBadge,
  hasActions,
  size = 'md',
  overlay = false,
  className,
}) => {
  return (
    <header
      className={`
        ${styles.header}
        ${styles[size]}
        ${overlay ? styles.overlay : ''}
        ${className ?? ''}
      `}
    >
      {hasBackButton && (
        <div className={styles.backButton}>
          <Skeleton variant="circular" width={32} height={32} />
        </div>
      )}
      {hasAvatar && (
        <div className={styles.visual}>
          <Skeleton variant="circular" width={40} height={40} />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <Skeleton variant="text" width={120} height={size === 'lg' ? 24 : 20} />
          {hasBadge && <Skeleton variant="rectangular" width={60} height={20} />}
        </div>
        {hasSubtitle && <Skeleton variant="text" width={200} height={16} />}
      </div>
      {hasActions && (
        <div className={styles.actions}>
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
      )}
    </header>
  );
};

const PageHeaderInner: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  avatar,
  badge,
  backButton,
  actions,
  actionsElement,
  size = 'md',
  overlay = false,
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <PageHeaderSkeleton
        hasBackButton={!!backButton}
        hasAvatar={!!avatar}
        hasSubtitle={!!subtitle}
        hasBadge={!!badge}
        hasActions={!!actions?.length || !!actionsElement}
        size={size}
        overlay={overlay}
        className={className}
      />
    );
  }

  const backButtonClasses = `
    ${styles.backButton}
    ${backButton?.mobileOnly ? styles.backButtonMobileOnly : ''}
  `;

  return (
    <header
      className={`
        ${styles.header}
        ${styles[size]}
        ${overlay ? styles.overlay : ''}
        ${className ?? ''}
      `}
    >
      {backButton && (
        <Link
          href={backButton.href}
          className={backButtonClasses}
          onClick={backButton.onClick}
          aria-label="Go back"
        >
          <Icon name="chevron-left" size="md" />
        </Link>
      )}

      {avatar && (
        <div className={styles.visual}>
          <Avatar
            address={avatar.address}
            src={avatar.src}
            size={avatar.size ?? 'md'}
          />
        </div>
      )}

      {icon && !avatar && (
        <div className={styles.visual}>{icon}</div>
      )}

      <div className={styles.content}>
        <div className={styles.titleRow}>
          <span className={styles.title}>{title}</span>
          {badge && <div className={styles.badge}>{badge}</div>}
        </div>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>

      {(actions && actions.length > 0) || actionsElement ? (
        <div className={styles.actions}>
          {actionsElement}
          {actions?.map((action, index) => (
            <Button
              key={`${action.label}-${index}`}
              variant={action.variant ?? 'ghost'}
              size={action.size ?? 'sm'}
              onClick={action.onClick}
              leftIcon={action.icon}
              loading={action.loading}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </header>
  );
};

export const PageHeader = React.memo(PageHeaderInner);
PageHeader.displayName = 'PageHeader';
