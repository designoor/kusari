'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { ConsentState } from '@xmtp/browser-sdk';
import { useXmtpContext } from './XmtpProvider';
import { useUnreadContext } from './UnreadProvider';
import {
  listConversations,
  streamConversations,
  getConversationById,
} from '@/services/xmtp/conversations';
import { getLatestMessage, streamAllMessages } from '@/services/xmtp/messages';
import { getLastReadTimes } from '@/services/xmtp/readReceipts';
import { getInboxConsentState } from '@/services/xmtp/consent';
import { getAddressForInboxId } from '@/services/xmtp/identity';
import { useConsentStream } from '@/hooks/useConsent';
import type { ConsentUpdate } from '@/types/consent';
import type { Conversation, Dm, ConversationPreview } from '@/types/conversation';

/**
 * Type guard to check if a conversation is a DM
 */
function isDm(conversation: Conversation): conversation is Dm {
  return 'peerInboxId' in conversation && typeof conversation.peerInboxId === 'function';
}

/**
 * Context value for the centralized conversation data provider
 */
interface ConversationDataContextValue {
  /** Map of conversation ID to conversation object */
  conversations: Map<string, Conversation>;
  /** Map of conversation ID to preview */
  previews: Map<string, ConversationPreview>;
  /** All previews as sorted array (most recent first) */
  allPreviews: ConversationPreview[];
  /** Allowed conversations only */
  allowedPreviews: ConversationPreview[];
  /** Unknown/pending conversations (message requests) */
  requestPreviews: ConversationPreview[];
  /** Denied conversations */
  deniedPreviews: ConversationPreview[];
  /** True while loading */
  isLoading: boolean;
  /** True after first load attempt */
  hasAttemptedLoad: boolean;
  /** Error if any */
  error: Error | null;
  /** Refresh all conversations */
  refresh: () => Promise<void>;
  /** Get a specific conversation by ID */
  getConversation: (id: string) => Promise<Conversation | null>;
}

const ConversationDataContext = createContext<ConversationDataContextValue | null>(null);

/**
 * Hook to access conversation data from the provider.
 * Must be used within a ConversationDataProvider.
 */
export function useConversationData(): ConversationDataContextValue {
  const context = useContext(ConversationDataContext);
  if (!context) {
    throw new Error('useConversationData must be used within ConversationDataProvider');
  }
  return context;
}

interface ConversationDataState {
  conversations: Map<string, Conversation>;
  previews: Map<string, ConversationPreview>;
  isLoading: boolean;
  hasAttemptedLoad: boolean;
  error: Error | null;
}

/**
 * Provider that centralizes all conversation data management.
 *
 * This is the single source of truth for conversation data in the app.
 * It handles:
 * - Initial sync and load
 * - Single stream subscription for new conversations
 * - Single stream subscription for new messages (preview updates)
 * - Consent state updates
 *
 * All components should read from this provider via useConversationData()
 * or the simplified hooks (useAllowedConversations, etc.)
 */
export function ConversationDataProvider({ children }: { children: React.ReactNode }) {
  const { client, isInitialized } = useXmtpContext();
  const { setUnreadCount } = useUnreadContext();

  const [state, setState] = useState<ConversationDataState>({
    conversations: new Map(),
    previews: new Map(),
    isLoading: false,
    hasAttemptedLoad: false,
    error: null,
  });

  // Ref to track conversations for stable getConversation callback
  const conversationsRef = useRef(state.conversations);
  useEffect(() => {
    conversationsRef.current = state.conversations;
  }, [state.conversations]);

  /**
   * Handle consent updates from centralized consent stream
   */
  const handleConsentUpdate = useCallback((updates: ConsentUpdate[]) => {
    setState((prev) => {
      const updatedPreviews = new Map(prev.previews);
      let hasChanges = false;

      for (const update of updates) {
        // Find preview matching this inbox ID
        for (const [id, preview] of updatedPreviews) {
          if (preview.peerInboxId === update.inboxId && preview.consentState !== update.state) {
            updatedPreviews.set(id, { ...preview, consentState: update.state });
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        return { ...prev, previews: updatedPreviews };
      }
      return prev;
    });
  }, []);

  // Subscribe to consent stream for real-time updates
  useConsentStream(handleConsentUpdate);

  /**
   * Build a conversation preview from a conversation
   */
  const buildPreview = useCallback(
    async (conversation: Conversation): Promise<ConversationPreview> => {
      if (!client) {
        throw new Error('XMTP client not initialized');
      }

      const conversationIsDm = isDm(conversation);
      let peerInboxId: string | undefined;
      let peerAddress: string | undefined;
      let groupName: string | undefined;

      if (conversationIsDm) {
        peerInboxId = await conversation.peerInboxId();
        if (peerInboxId) {
          const address = await getAddressForInboxId(client, peerInboxId);
          peerAddress = address ?? undefined;
        }
      } else {
        groupName = conversation.name ?? undefined;
      }

      // Get consent state
      let consentState: ConsentState;
      if (conversationIsDm && peerInboxId) {
        consentState = await getInboxConsentState(client, peerInboxId);
        console.log(`[Consent Debug] InboxId: ${peerInboxId.slice(0, 8)}..., State: ${consentState}`);
      } else {
        consentState = ConsentState.Allowed;
      }

      // Get the latest message
      const latestMessage = await getLatestMessage(conversation);
      const isTextMessage = latestMessage && typeof latestMessage.content === 'string';

      // Get last read times to compute unread state
      let unreadCount = 0;
      const currentInboxId = client.inboxId;
      if (isTextMessage && currentInboxId && latestMessage.senderInboxId !== currentInboxId) {
        try {
          const lastReadTimesMap = await getLastReadTimes(conversation);
          const myLastReadTime = lastReadTimesMap.get(currentInboxId) ?? BigInt(0);
          if (latestMessage.sentAtNs > myLastReadTime) {
            unreadCount = 1;
          }
        } catch {
          // Default to 0 unread
        }
      }

      // Sync unread count to UnreadProvider
      setUnreadCount(conversation.id, unreadCount);

      return {
        id: conversation.id,
        peerInboxId,
        peerAddress,
        groupName,
        lastMessage: isTextMessage
          ? {
              content: latestMessage.content as string,
              sentAt: latestMessage.sentAt,
              sentAtNs: latestMessage.sentAtNs,
              senderInboxId: latestMessage.senderInboxId,
            }
          : null,
        consentState,
        unreadCount,
        createdAt: conversation.createdAt ?? new Date(),
        isDm: conversationIsDm,
      };
    },
    [client, setUnreadCount]
  );

  /**
   * Load all conversations and build previews
   */
  const loadConversations = useCallback(async () => {
    if (!client || !isInitialized) {
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // XmtpProvider already synced preferences and conversations during initialization.
      // We just need to list the conversations that were synced.
      // If we sync again here, it can cause timing issues where list() returns empty.
      console.log('[ConversationData] Starting to list conversations...');
      const conversationList = await listConversations(client);
      console.log(`[ConversationData] Found ${conversationList.length} conversations`);

      // Debug: Log conversation IDs
      if (conversationList.length > 0) {
        conversationList.forEach((conv, i) => {
          console.log(`[ConversationData] Conversation ${i}: ${conv.id.slice(0, 8)}...`);
        });
      }

      // Build previews for all conversations
      const previewPromises = conversationList.map((conv) => buildPreview(conv));
      const results = await Promise.allSettled(previewPromises);

      // Build maps
      const conversationsMap = new Map<string, Conversation>();
      const previewsMap = new Map<string, ConversationPreview>();

      for (let i = 0; i < conversationList.length; i++) {
        const conv = conversationList[i];
        const result = results[i];

        if (!conv || !result) continue;

        conversationsMap.set(conv.id, conv);

        if (result.status === 'fulfilled') {
          previewsMap.set(conv.id, result.value);
        } else {
          console.error('Failed to build conversation preview:', result.reason);
        }
      }

      // Debug: Log consent state distribution
      const consentCounts = { allowed: 0, unknown: 0, denied: 0 };
      for (const preview of previewsMap.values()) {
        if (preview.consentState === ConsentState.Allowed) consentCounts.allowed++;
        else if (preview.consentState === ConsentState.Unknown) consentCounts.unknown++;
        else if (preview.consentState === ConsentState.Denied) consentCounts.denied++;
      }
      console.log(`[ConversationData] Consent distribution: allowed=${consentCounts.allowed}, unknown=${consentCounts.unknown}, denied=${consentCounts.denied}`);

      setState({
        conversations: conversationsMap,
        previews: previewsMap,
        isLoading: false,
        hasAttemptedLoad: true,
        error: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load conversations');
      setState((prev) => ({
        ...prev,
        isLoading: false,
        hasAttemptedLoad: true,
        error,
      }));
      console.error('Failed to load conversations:', error);
    }
  }, [client, isInitialized, buildPreview]);

  /**
   * Refresh conversations
   */
  const refresh = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  /**
   * Get a specific conversation by ID.
   * Uses a ref for cache lookup to maintain stable callback reference.
   */
  const getConversation = useCallback(
    async (id: string): Promise<Conversation | null> => {
      // First check our cache (via ref for callback stability)
      const cached = conversationsRef.current.get(id);
      if (cached) {
        return cached;
      }
      // Fallback to fetching
      if (!client) {
        return null;
      }
      return getConversationById(client, id);
    },
    [client]
  );

  // Load conversations on mount and when client changes
  useEffect(() => {
    console.log(`[ConversationData] useEffect triggered: client=${!!client}, isInitialized=${isInitialized}`);
    if (!client || !isInitialized) {
      console.log('[ConversationData] Client not ready, resetting state');
      setState({
        conversations: new Map(),
        previews: new Map(),
        isLoading: false,
        hasAttemptedLoad: true,
        error: null,
      });
      return;
    }

    console.log('[ConversationData] Client ready, calling loadConversations...');
    void loadConversations();
  }, [isInitialized, client, loadConversations]);

  // Stream new conversations (single subscription)
  useEffect(() => {
    if (!client || !isInitialized) {
      return;
    }

    const cleanup = streamConversations(client, async (newConversation) => {
      try {
        const preview = await buildPreview(newConversation);

        setState((prev) => {
          const updatedConversations = new Map(prev.conversations);
          const updatedPreviews = new Map(prev.previews);

          updatedConversations.set(newConversation.id, newConversation);
          updatedPreviews.set(preview.id, preview);

          return {
            ...prev,
            conversations: updatedConversations,
            previews: updatedPreviews,
          };
        });
      } catch (err) {
        console.error('Failed to process new conversation:', err);
      }
    });

    return cleanup;
  }, [client, isInitialized, buildPreview]);

  // Stream all messages to update conversation previews (single subscription)
  useEffect(() => {
    if (!client || !isInitialized) {
      return;
    }

    const cleanup = streamAllMessages(client, (message) => {
      // Only use text messages for preview
      const isTextMessage = typeof message.content === 'string';
      if (!isTextMessage) {
        return;
      }

      const isIncomingMessage = message.senderInboxId !== client.inboxId;
      const conversationId = message.conversationId;

      setState((prev) => {
        const currentPreview = prev.previews.get(conversationId);

        if (!currentPreview) {
          // Message is for a conversation not in our list yet
          return prev;
        }

        // Only update if the message is newer
        const currentLastMessageTime = currentPreview.lastMessage?.sentAt?.getTime() ?? 0;
        const newMessageTime = message.sentAt.getTime();

        if (newMessageTime <= currentLastMessageTime) {
          return prev;
        }

        // Create updated preview
        const updatedPreview: ConversationPreview = {
          ...currentPreview,
          lastMessage: {
            content: message.content as string,
            sentAt: message.sentAt,
            sentAtNs: message.sentAtNs,
            senderInboxId: message.senderInboxId,
          },
          unreadCount: isIncomingMessage
            ? (currentPreview.unreadCount ?? 0) + 1
            : currentPreview.unreadCount,
        };

        const updatedPreviews = new Map(prev.previews);
        updatedPreviews.set(conversationId, updatedPreview);

        return {
          ...prev,
          previews: updatedPreviews,
        };
      });
    });

    return cleanup;
  }, [client, isInitialized]);

  /**
   * Sort previews by last message date (most recent first)
   */
  const sortPreviews = useCallback((previewsArray: ConversationPreview[]): ConversationPreview[] => {
    return [...previewsArray].sort((a, b) => {
      const aTime = a.lastMessage?.sentAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.lastMessage?.sentAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });
  }, []);

  // Derive sorted and filtered arrays from the Map
  const allPreviews = useMemo(() => {
    return sortPreviews(Array.from(state.previews.values()));
  }, [state.previews, sortPreviews]);

  const allowedPreviews = useMemo(() => {
    return sortPreviews(
      Array.from(state.previews.values()).filter(
        (p) => p.consentState === ConsentState.Allowed
      )
    );
  }, [state.previews, sortPreviews]);

  const requestPreviews = useMemo(() => {
    return sortPreviews(
      Array.from(state.previews.values()).filter(
        (p) => p.consentState === ConsentState.Unknown
      )
    );
  }, [state.previews, sortPreviews]);

  const deniedPreviews = useMemo(() => {
    return sortPreviews(
      Array.from(state.previews.values()).filter(
        (p) => p.consentState === ConsentState.Denied
      )
    );
  }, [state.previews, sortPreviews]);

  const value = useMemo(
    () => ({
      conversations: state.conversations,
      previews: state.previews,
      allPreviews,
      allowedPreviews,
      requestPreviews,
      deniedPreviews,
      isLoading: state.isLoading,
      hasAttemptedLoad: state.hasAttemptedLoad,
      error: state.error,
      refresh,
      getConversation,
    }),
    [
      state.conversations,
      state.previews,
      state.isLoading,
      state.hasAttemptedLoad,
      state.error,
      allPreviews,
      allowedPreviews,
      requestPreviews,
      deniedPreviews,
      refresh,
      getConversation,
    ]
  );

  return (
    <ConversationDataContext.Provider value={value}>
      {children}
    </ConversationDataContext.Provider>
  );
}
