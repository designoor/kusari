'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';

/**
 * Context value for tracking the currently active conversation
 */
interface ActiveConversationContextValue {
  /** The ID of the currently viewed conversation, or null if none */
  activeConversationId: string | null;
  /** Set the active conversation ID */
  setActiveConversationId: (id: string | null) => void;
}

const ActiveConversationContext = createContext<ActiveConversationContextValue | null>(null);

/**
 * Hook to access the active conversation context.
 * Must be used within an ActiveConversationProvider.
 */
export function useActiveConversation(): ActiveConversationContextValue {
  const context = useContext(ActiveConversationContext);
  if (!context) {
    throw new Error('useActiveConversation must be used within ActiveConversationProvider');
  }
  return context;
}

/**
 * Provider that tracks which conversation the user is currently viewing.
 * Used to prevent showing notifications for the active conversation.
 */
export function ActiveConversationProvider({ children }: { children: React.ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      activeConversationId,
      setActiveConversationId,
    }),
    [activeConversationId]
  );

  return (
    <ActiveConversationContext.Provider value={value}>
      {children}
    </ActiveConversationContext.Provider>
  );
}
