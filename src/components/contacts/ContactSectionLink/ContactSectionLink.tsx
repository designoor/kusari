'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { ChevronRightIcon } from '@/components/ui/Icon/icons';
import styles from './ContactSectionLink.module.css';

export interface ContactSectionLinkProps {
  /** Link destination */
  href: string;
  /** Icon to display */
  icon: React.ReactNode;
  /** Section title */
  title: string;
  /** Count to display in badge */
  count?: number;
  /** Additional description */
  description?: string;
  /** Badge variant */
  variant?: 'default' | 'accent' | 'warning';
  /** Additional CSS class */
  className?: string;
}

/**
 * ContactSectionLink is a navigable link to a contacts section.
 *
 * Used for:
 * - "New requests (3)" link to /contacts/requests
 * - "Denied (2)" link to /contacts/denied
 */
export const ContactSectionLink: React.FC<ContactSectionLinkProps> = ({
  href,
  icon,
  title,
  count,
  description,
  variant = 'default',
  className,
}) => {
  return (
    <Link href={href} className={`${styles.link} ${className ?? ''}`}>
      <span className={styles.icon}>{icon}</span>
      <div className={styles.content}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </div>
      <div className={styles.right}>
        {count !== undefined && count > 0 && (
          <Badge variant={variant} size="sm" count={count} />
        )}
        <ChevronRightIcon className={styles.chevron} size={16} />
      </div>
    </Link>
  );
};
