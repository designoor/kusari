# Message Scaling: Pagination + Virtualization Plan

## Overview

Implement a two-layer optimization for handling large conversations:
1. **Pagination (Primary)**: Load messages on-demand via XMTP SDK cursor-based pagination
2. **Virtualization (Secondary, Optional)**: Render only visible messages in DOM

**Recommendation**: Start with pagination only. It solves 90% of the problem with 50% of the effort.

---

## Why Pagination First?

| Problem | Pagination | Virtualization |
|---------|------------|----------------|
| Slow initial load (fetch all) | ✅ Solves | ❌ Doesn't help |
| High memory (all messages in state) | ✅ Solves | ❌ Doesn't help |
| Large network payload | ✅ Solves | ❌ Doesn't help |
| Too many DOM nodes | ❌ Partial | ✅ Solves |

**Current problem**: `useMessages` loads ALL messages with no pagination:
```typescript
// src/hooks/useMessages.ts - line 159
const messages = await listMessages(conversation);  // No limit!
```

---

## XMTP SDK Pagination Support

The SDK **fully supports pagination** via `ListMessagesOptions`:

```typescript
interface ListMessagesOptions {
  sentBeforeNs?: bigint;    // Cursor: load messages BEFORE this timestamp
  sentAfterNs?: bigint;     // Load messages AFTER this timestamp
  limit?: bigint;           // Max messages per page (e.g., 50n)
  direction?: SortDirection; // Ascending (0) or Descending (1)
}
```

---

## Benefits

### Performance Comparison

| Metric | Before | With Pagination | With Pagination + Virtualization |
|--------|--------|-----------------|----------------------------------|
| Initial Load | All messages | 50 messages | 50 messages |
| Memory (1000 msgs) | ~50MB | ~2.5MB (50 msgs) | ~2.5MB |
| Network Payload | All at once | 50 per page | 50 per page |
| DOM Nodes | ~5000 | ~250 | ~50 (visible only) |
| Time to Interactive | 2-5s | <100ms | <100ms |

### User Experience
- **Instant open**: Conversations load immediately (50 messages)
- **Seamless history**: Scroll up to load older messages automatically
- **Low memory**: Works on mobile/low-end devices
- **Scales infinitely**: 10,000+ message conversations work smoothly

---

## Architecture

### Current (Problematic)
```
Open conversation → Fetch ALL messages → Render ALL in DOM
```

### Proposed (Optimal)
```
Open conversation → Fetch 50 newest → Render in DOM
                         ↓
            User scrolls up → Fetch 50 older → Prepend to state
                         ↓
            State exceeds 300 → Trim oldest from memory (optional)
```

---

## Phase 1: Pagination Implementation (Recommended)

### Step 1: Add Pagination State to useMessages

**Edit**: `src/hooks/useMessages.ts`

```typescript
interface UseMessagesState {
  messages: DecodedMessage[];
  pendingMessages: PendingMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: Error | null;
  // NEW: Pagination state
  hasMoreMessages: boolean;
  isFetchingMore: boolean;
  oldestMessageNs: bigint | null;  // Cursor for pagination
}

interface UseMessagesReturn extends UseMessagesState {
  // ... existing
  loadMoreMessages: () => Promise<void>;  // NEW
}
```

### Step 2: Implement Paginated Initial Load

```typescript
const PAGE_SIZE = 50n;

// Initial load: fetch newest 50 messages
const loadInitialMessages = useCallback(async () => {
  if (!conversation) return;

  setState(prev => ({ ...prev, isLoading: true }));

  try {
    const messages = await listMessages(conversation, {
      limit: PAGE_SIZE,
      direction: SortDirection.Descending,  // Newest first
    });

    // Reverse to get chronological order (oldest first in array)
    const chronological = [...messages].reverse();
    const oldest = chronological[0];

    setState(prev => ({
      ...prev,
      messages: chronological,
      isLoading: false,
      hasMoreMessages: messages.length === Number(PAGE_SIZE),
      oldestMessageNs: oldest?.sentAtNs ?? null,
    }));
  } catch (err) {
    setState(prev => ({ ...prev, isLoading: false, error: err as Error }));
  }
}, [conversation]);
```

### Step 3: Implement Load More (Infinite Scroll)

```typescript
const loadMoreMessages = useCallback(async () => {
  if (!conversation || !state.oldestMessageNs || state.isFetchingMore || !state.hasMoreMessages) {
    return;
  }

  setState(prev => ({ ...prev, isFetchingMore: true }));

  try {
    const olderMessages = await listMessages(conversation, {
      sentBeforeNs: state.oldestMessageNs,
      limit: PAGE_SIZE,
      direction: SortDirection.Descending,
    });

    if (olderMessages.length === 0) {
      setState(prev => ({ ...prev, isFetchingMore: false, hasMoreMessages: false }));
      return;
    }

    // Reverse to chronological, prepend to existing
    const chronological = [...olderMessages].reverse();
    const newOldest = chronological[0];

    setState(prev => ({
      ...prev,
      messages: [...chronological, ...prev.messages],
      isFetchingMore: false,
      hasMoreMessages: olderMessages.length === Number(PAGE_SIZE),
      oldestMessageNs: newOldest?.sentAtNs ?? prev.oldestMessageNs,
    }));
  } catch (err) {
    setState(prev => ({ ...prev, isFetchingMore: false }));
    console.error('Failed to load more messages:', err);
  }
}, [conversation, state.oldestMessageNs, state.isFetchingMore, state.hasMoreMessages]);
```

### Step 4: Add Scroll Detection to MessageList

**Edit**: `src/components/chat/MessageList/MessageList.tsx`

```typescript
interface MessageListProps {
  messageGroups: MessageGroup[];
  isLoading?: boolean;
  // NEW:
  hasMoreMessages?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
}

// Inside component:
const handleScroll = useCallback(() => {
  const container = scrollRef.current;
  if (!container || !onLoadMore || isFetchingMore || !hasMoreMessages) return;

  // Trigger load when scrolled within 200px of top
  if (container.scrollTop < 200) {
    onLoadMore();
  }
}, [onLoadMore, isFetchingMore, hasMoreMessages]);

useEffect(() => {
  const container = scrollRef.current;
  container?.addEventListener('scroll', handleScroll);
  return () => container?.removeEventListener('scroll', handleScroll);
}, [handleScroll]);
```

### Step 5: Add Loading Indicator at Top

```typescript
{isFetchingMore && (
  <div className={styles.loadingMore}>
    <Icon name="loader" size="sm" />
    <span>Loading older messages...</span>
  </div>
)}
```

---

## Phase 2: Virtualization (Optional)

Only implement if you observe scroll performance issues after Phase 1.

```bash
pnpm add react-virtuoso
```

Then wrap MessageList items with Virtuoso for DOM efficiency (only renders visible ~15 messages).

---

## Phase 3: Memory Windowing (Optional)

For extreme cases (user scrolls through 1000+ messages):

```typescript
const MAX_MESSAGES_IN_MEMORY = 300;

// After loading more, trim if needed
if (prev.messages.length > MAX_MESSAGES_IN_MEMORY) {
  return {
    ...prev,
    messages: prev.messages.slice(-MAX_MESSAGES_IN_MEMORY),
  };
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useMessages.ts` | Add pagination state & `loadMoreMessages` |
| `src/services/xmtp/messages.ts` | Already supports options (no change needed) |
| `src/components/chat/MessageList/MessageList.tsx` | Add scroll detection & loading UI |
| `src/components/chat/MessageList/MessageList.module.css` | Add `.loadingMore` styles |
| `src/app/chat/[conversationId]/page.tsx` | Pass new props to MessageList |

---

## Testing Strategy

### Manual Testing
1. Open conversation → only 50 messages fetched (check network tab)
2. Scroll to top → "Loading older messages..." appears
3. Older messages load → scroll position preserved
4. Continue scrolling → more pages load until `hasMoreMessages: false`
5. New message arrives → appends correctly, auto-scrolls if at bottom
6. Send message → optimistic UI works unchanged

### Edge Cases
1. Conversation with <50 messages → `hasMoreMessages: false` immediately
2. Conversation with exactly 50 messages → one more fetch returns empty
3. Rapid scrolling → debounce prevents duplicate fetches
4. Network error during load more → graceful error, can retry

---

## Estimated Effort

| Task | Time |
|------|------|
| Add pagination state to useMessages | 1 hour |
| Implement loadMoreMessages | 1-2 hours |
| Add scroll detection to MessageList | 1 hour |
| Loading indicator UI | 30 min |
| Testing & edge cases | 2 hours |
| **Total (Phase 1 - Pagination only)** | **5-6 hours** |
| Optional: Add react-virtuoso (Phase 2) | +2-3 hours |

---

## Complexity Assessment

### Pagination (Phase 1): Low Complexity
- Add 3 state fields + 1 callback
- Straightforward cursor-based fetching
- ~100 lines of code changes
- Low risk of bugs

### Virtualization (Phase 2): Medium Complexity

| Challenge | Why It's Tricky |
|-----------|-----------------|
| Variable heights | Messages wrap differently based on content length |
| Scroll position preservation | When loading older messages, must maintain position |
| Auto-scroll to bottom | Current `scrollIntoView()` won't work with virtualization |
| Date separators | Need to flatten message groups into single list |
| Read receipt tracking | Need to track "last from user" across flattened list |

**Recommendation**: Start with pagination. Add virtualization only if users report scroll performance issues with 100+ messages loaded.

---

## Rollout Strategy

1. **Phase 1**: Implement pagination only (biggest impact, lowest risk)
2. **Observe**: Monitor real usage for scroll performance issues
3. **Phase 2**: Add virtualization only if needed (medium complexity)
4. **Phase 3**: Add memory windowing for extreme edge cases
