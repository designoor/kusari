'use client';

import React, { createContext, useContext, useCallback, useState, useMemo } from 'react';

interface NewChatModalContextValue {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const NewChatModalContext = createContext<NewChatModalContextValue | null>(null);

export interface NewChatModalProviderProps {
  children: React.ReactNode;
}

export const NewChatModalProvider: React.FC<NewChatModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      openModal,
      closeModal,
    }),
    [isOpen, openModal, closeModal]
  );

  return (
    <NewChatModalContext.Provider value={value}>
      {children}
    </NewChatModalContext.Provider>
  );
};

/**
 * Hook to access the new chat modal state and controls
 *
 * @returns Object with isOpen state and openModal/closeModal functions
 * @throws Error if used outside of NewChatModalProvider
 */
export function useNewChatModal(): NewChatModalContextValue {
  const context = useContext(NewChatModalContext);
  if (!context) {
    throw new Error('useNewChatModal must be used within a NewChatModalProvider');
  }
  return context;
}
