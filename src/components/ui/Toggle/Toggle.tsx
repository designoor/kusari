'use client';

import React from 'react';
import styles from './Toggle.module.css';

export interface ToggleProps {
  /** Whether the toggle is checked/on */
  checked: boolean;
  /** Callback when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Accessible label */
  'aria-label'?: string;
  /** ID of element that labels this toggle */
  'aria-labelledby'?: string;
  /** Additional class name */
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className,
  ...ariaProps
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <label
      className={`${styles.toggle} ${styles[size]} ${disabled ? styles.disabled : ''} ${className ?? ''}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={styles.input}
        {...ariaProps}
      />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
    </label>
  );
};

Toggle.displayName = 'Toggle';
