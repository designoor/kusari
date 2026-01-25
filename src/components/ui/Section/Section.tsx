'use client';

import React from 'react';
import { SectionTitle } from '../SectionTitle';
import styles from './Section.module.css';

export type SectionVariant = 'default' | 'warning' | 'error' | 'bare';

export interface SectionProps {
  /** Optional section title */
  title?: string;
  /** Visual variant of the content box */
  variant?: SectionVariant;
  /** Section content */
  children: React.ReactNode;
  /** Additional CSS class for the container */
  className?: string;
  /** Additional CSS class for the content box */
  contentClassName?: string;
}

/**
 * Section displays a titled content area with a styled box.
 * Common pattern across settings, contacts, and onboarding pages.
 *
 * Use variant="bare" when children already have their own box styling.
 */
export const Section: React.FC<SectionProps> = ({
  title,
  variant = 'default',
  children,
  className,
  contentClassName,
}) => {
  const containerClasses = [styles.section, className].filter(Boolean).join(' ');
  const isBare = variant === 'bare';
  const contentClasses = isBare
    ? contentClassName
    : [styles.content, styles[variant], contentClassName].filter(Boolean).join(' ');

  return (
    <section className={containerClasses}>
      {title && <SectionTitle>{title}</SectionTitle>}
      {isBare ? (
        children
      ) : (
        <div className={contentClasses}>
          {children}
        </div>
      )}
    </section>
  );
};
