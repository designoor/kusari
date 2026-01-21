import React from 'react';
import styles from './Logo.module.css';

export interface LogoProps {
  /** Additional CSS class */
  className?: string;
}

/**
 * Logo displays the Kusari app logo.
 */
export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`${styles.logo} ${className ?? ''}`}>K</div>
  );
};
