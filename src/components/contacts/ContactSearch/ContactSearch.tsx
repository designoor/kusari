'use client';

import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { SearchIcon, XIcon } from '@/components/ui/Icon/icons';
import styles from './ContactSearch.module.css';

export interface ContactSearchProps {
  /** Placeholder text */
  placeholder?: string;
  /** Current search value */
  value?: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * ContactSearch provides a search input for filtering contacts.
 */
export const ContactSearch: React.FC<ContactSearchProps> = ({
  placeholder = 'Search contacts...',
  value: controlledValue,
  onChange,
  className,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange(newValue);
    },
    [onChange, isControlled]
  );

  const handleClear = useCallback(() => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChange('');
  }, [onChange, isControlled]);

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <Input
        variant="search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        leftElement={<SearchIcon className={styles.searchIcon} />}
        rightElement={
          value ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              aria-label="Clear search"
            >
              <XIcon className={styles.clearIcon} />
            </button>
          ) : null
        }
        fullWidth
      />
    </div>
  );
};
