import React from 'react';
import styles from './Input.module.css';

export type InputVariant = 'default' | 'search';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  fullWidth?: boolean;
}

const InputInner = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      label,
      error,
      hint,
      leftElement,
      rightElement,
      fullWidth = false,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? React.useId();
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className={`${styles.wrapper} ${fullWidth ? styles.fullWidth : ''}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div
          className={`
            ${styles.inputContainer}
            ${styles[variant]}
            ${error ? styles.hasError : ''}
            ${disabled ? styles.disabled : ''}
          `}
        >
          {leftElement && <div className={styles.leftElement}>{leftElement}</div>}
          <input
            ref={ref}
            id={inputId}
            className={`${styles.input} ${className ?? ''}`}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              [errorId, hintId].filter(Boolean).join(' ') || undefined
            }
            {...props}
          />
          {rightElement && <div className={styles.rightElement}>{rightElement}</div>}
        </div>
        {error && (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

InputInner.displayName = 'Input';

export const Input = React.memo(InputInner);
Input.displayName = 'Input';
