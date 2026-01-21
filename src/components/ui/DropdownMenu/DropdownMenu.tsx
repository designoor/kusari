'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, type ButtonVariant, type ButtonSize } from '@/components/ui/Button';
import { MoreVerticalIcon } from '@/components/ui/Icon/icons';
import styles from './DropdownMenu.module.css';

export interface DropdownMenuItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Click handler */
  onClick: () => void;
  /** Whether this is a destructive action */
  danger?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
}

export interface DropdownMenuProps {
  /** Menu items */
  items: DropdownMenuItem[];
  /** Custom trigger content (defaults to MoreVerticalIcon) */
  trigger?: React.ReactNode;
  /** Button variant for the trigger */
  variant?: ButtonVariant;
  /** Button size for the trigger */
  size?: ButtonSize;
  /** Accessible label for the trigger button */
  ariaLabel?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * DropdownMenu provides a simple dropdown menu triggered by a button.
 * Uses the Button component for consistent styling.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  trigger,
  variant = 'ghost',
  size = 'sm',
  ariaLabel = 'More options',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleItemClick = useCallback((item: DropdownMenuItem) => {
    if (item.disabled) return;
    item.onClick();
    setIsOpen(false);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`${styles.container} ${className ?? ''}`}>
      <Button
        variant={variant}
        size={size}
        onClick={handleToggle}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={styles.trigger}
      >
        {trigger ?? <MoreVerticalIcon size={size === 'sm' ? 18 : size === 'md' ? 20 : 24} />}
      </Button>

      {isOpen && (
        <div className={styles.menu} role="menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.menuItem} ${item.danger ? styles.menuItemDanger : ''}`}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              role="menuitem"
            >
              {item.icon && <span className={styles.menuItemIcon}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
