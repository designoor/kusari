import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../Icon';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  noPadding?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  noPadding = false,
  className,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Handle escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Focus trap - focus first focusable element when opened
  React.useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Only render portal on client side
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={`${styles.modal} ${styles[size]} ${className ?? ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {title && (
          <div className={styles.header}>
            <h2 id="modal-title" className={styles.title}>
              {title}
            </h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
            >
              <Icon name="x" size="md" />
            </button>
          </div>
        )}
        {!title && (
          <button
            type="button"
            className={styles.closeButtonAbsolute}
            onClick={onClose}
            aria-label="Close modal"
          >
            <Icon name="x" size="md" />
          </button>
        )}
        <div className={`${styles.content} ${noPadding ? styles.noPadding : ''}`}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
