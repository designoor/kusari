import React from 'react';
import { Icon } from '../Icon';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
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

    // Check if children is empty (icon-only button)
    const hasLabel = React.Children.count(children) > 0 &&
      !(React.Children.count(children) === 1 && children === '');
    const hasLeftIcon = Boolean(leftIcon) || loading;
    const hasRightIcon = Boolean(rightIcon);
    const isIconOnly = !hasLabel && (hasLeftIcon || hasRightIcon);

    return (
      <button
        ref={ref}
        className={`
          ${styles.button}
          ${styles[variant]}
          ${styles[size]}
          ${fullWidth ? styles.fullWidth : ''}
          ${isDisabled ? styles.disabled : ''}
          ${isIconOnly ? styles.iconOnly : ''}
          ${!isIconOnly && hasLeftIcon ? styles.hasLeftIcon : ''}
          ${!isIconOnly && hasRightIcon ? styles.hasRightIcon : ''}
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
        {hasLabel && <span className={styles.content}>{children}</span>}
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
