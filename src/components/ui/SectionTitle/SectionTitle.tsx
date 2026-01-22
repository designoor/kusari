'use client';

import React from 'react';
import styles from './SectionTitle.module.css';

export interface SectionTitleProps {
  /** The title text */
  children: React.ReactNode;
  /** Additional CSS class */
  className?: string;
}

/**
 * SectionTitle displays a styled section heading with bottom border.
 */
export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  className,
}) => {
  return (
    <h2 className={[styles.title, className].filter(Boolean).join(' ')}>
      {children}
    </h2>
  );
};
