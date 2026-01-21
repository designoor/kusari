import React from 'react';
import { Icon } from '../Icon';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const ButtonInner = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`
          ${styles.button}
          ${styles[variant]}
          ${styles[size]}
          ${fullWidth ? styles.fullWidth : ''}
          ${isDisabled ? styles.disabled : ''}
          ${className ?? ''}
        `}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className={styles.iconWrapper}>
            <Icon name="loader" size={size === 'sm' ? 'sm' : 'md'} aria-label="Loading" />
          </span>
        )}
        {!loading && leftIcon && (
          <span className={styles.iconWrapper}>{leftIcon}</span>
        )}
        <span className={styles.content}>{children}</span>
        {!loading && rightIcon && (
          <span className={styles.iconWrapper}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

ButtonInner.displayName = 'Button';

export const Button = React.memo(ButtonInner);
Button.displayName = 'Button';
