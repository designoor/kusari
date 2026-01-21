# New Chat Flow Implementation Plan

## Overview
Add ability for users to initiate new conversations by entering an Ethereum address. The flow opens a modal, validates the address, shows Ethos reputation, and creates the conversation.

## User Requirements
- **Entry points**: Button in chat list header + contacts page header
- **UI**: Modal overlay (stays on current page)
- **Address input**: Raw Ethereum addresses only (no ENS for MVP)
- **Ethos score**: Show recipient's reputation before connecting
- **Sender experience**: Conversation appears in their chat list immediately
- **Recipient experience**: Sees request in `/contacts/requests` until accepted

---

## Implementation Steps

### Phase 1: XMTP Identity Service

**File**: `src/services/xmtp/identity.ts` (new)

Add functions to work with addresses instead of inbox IDs:

```typescript
// Check if address can receive XMTP messages
canMessageAddress(client: Client, address: string): Promise<boolean>

// Find or create DM by Ethereum address (resolves inbox ID internally)
findOrCreateDmByAddress(client: Client, address: string): Promise<{ dm: Dm; peerInboxId: string }>
```

**Key**: Use `Client.canMessage()` with `IdentifierKind.Ethereum` to verify address, then use SDK's conversation creation methods.

**Update**: `src/services/xmtp/index.ts` - export new functions

---

### Phase 2: Modal State Provider

**File**: `src/providers/NewChatModalProvider.tsx` (new)

```typescript
interface NewChatModalContextValue {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}
```

**Update**: `src/providers/index.ts` - export provider and hook

---

### Phase 3: useNewChat Hook

**File**: `src/hooks/useNewChat.ts` (new)

```typescript
interface UseNewChatReturn {
  checkCanMessage: (address: string) => Promise<boolean>;
  createConversation: (address: string) => Promise<string>; // returns conversationId
  isChecking: boolean;
  isCreating: boolean;
  error: Error | null;
}
```

**Responsibilities**:
1. Validate address can receive XMTP messages
2. Create/find DM conversation
3. Auto-set consent to `allowed` for sender (so it appears in their chat list)
4. Return conversation ID for navigation

---

### Phase 4: NewChatModal Component

**Files**:
- `src/components/chat/NewChatModal/NewChatModal.tsx`
- `src/components/chat/NewChatModal/NewChatModal.module.css`
- `src/components/chat/NewChatModal/index.ts`

**UI Layout**:
```
┌─────────────────────────────────────┐
│  New Chat                      [X]  │
├─────────────────────────────────────┤
│  Enter recipient address            │
│  ┌───────────────────────────────┐  │
│  │ 0x...                         │  │
│  └───────────────────────────────┘  │
│  [validation error here]            │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ [Avatar] 0x1234...5678        │  │  ← Shows when valid
│  │          Score: 1,234         │  │
│  │          ✓ Available on XMTP  │  │
│  └───────────────────────────────┘  │
│                                     │
│           [Start Chat]              │
└─────────────────────────────────────┘
```

**States**:
- Empty input
- Valid address → fetch Ethos + check XMTP
- Invalid format → show error
- Not on XMTP → show warning, disable button
- Creating → loading state on button

**Reuse existing components**:
- `Modal` from `@/components/ui/Modal`
- `Input` from `@/components/ui/Input`
- `Button` from `@/components/ui/Button`
- `Avatar` from `@/components/ui/Avatar`
- `EthosScore` from `@/components/reputation/EthosScore`

---

### Phase 5: Integration - Add Entry Points

**File**: `src/components/chat/ConversationList/ConversationList.tsx`

Add header section with "New Chat" button before search:
```tsx
<div className={styles.header}>
  <h2>Messages</h2>
  <Button variant="ghost" size="sm" onClick={openModal}>
    <Icon name="plus" /> New
  </Button>
</div>
```

**File**: `src/app/contacts/page.tsx`

Add button next to title in header:
```tsx
<div className={styles.header}>
  <h1 className={styles.title}>Contacts</h1>
  <Button variant="ghost" size="sm" onClick={openModal}>
    <Icon name="plus" /> New Chat
  </Button>
  ...
</div>
```

---

### Phase 6: Wire Up Provider

**File**: `src/app/layout.tsx` or `src/providers/index.ts`

Add `NewChatModalProvider` to provider tree.

**File**: `src/app/chat/page.tsx` (or layout)

Render `<NewChatModal />` at page/layout level so it's available when modal opens.

---

## Error Handling

| Scenario | Message | Action |
|----------|---------|--------|
| Invalid address format | "Enter a valid Ethereum address (0x...)" | Fix input |
| Self-chat | "You cannot message yourself" | Fix input |
| Not on XMTP | "This address hasn't enabled XMTP yet" | Disable button |
| Network error | "Unable to verify. Try again." | Retry button |
| Create failed | "Failed to start conversation" | Retry |

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `src/services/xmtp/identity.ts` | NEW - address resolution functions |
| `src/services/xmtp/index.ts` | Export new functions |
| `src/providers/NewChatModalProvider.tsx` | NEW - modal state context |
| `src/providers/index.ts` | Export provider |
| `src/hooks/useNewChat.ts` | NEW - conversation creation hook |
| `src/hooks/index.ts` | Export hook |
| `src/components/chat/NewChatModal/*` | NEW - modal UI components |
| `src/components/chat/index.ts` | Export modal |
| `src/components/chat/ConversationList/ConversationList.tsx` | Add header with New Chat button |
| `src/components/chat/ConversationList/ConversationList.module.css` | Header styles |
| `src/app/contacts/page.tsx` | Add New Chat button |
| `src/app/contacts/contacts.module.css` | Adjust header layout |
| `src/app/layout.tsx` | Add NewChatModalProvider |
| `src/app/chat/page.tsx` | Render NewChatModal |

---

## Data Flow Summary

```
1. User clicks "New Chat" button
2. openModal() from NewChatModalProvider
3. Modal opens, user enters address
4. On input change (debounced 300ms):
   - Validate format with isValidAddress()
   - If valid: checkCanMessage() + useEthosScore()
5. User clicks "Start Chat"
6. createConversation():
   a. findOrCreateDmByAddress() → creates DM
   b. allowInboxes() → auto-consent for sender
   c. Return conversationId
7. closeModal()
8. router.push(`/chat/${conversationId}`)
9. Toast: "Conversation started"
```

---

## Verification Plan

1. **Unit test**: Address validation edge cases
2. **Manual test flow**:
   - Open modal from chat list → enter valid address → see Ethos score → create → lands in chat
   - Open modal from contacts → same flow
   - Enter invalid address → see error
   - Enter address not on XMTP → see warning, button disabled
   - Enter own address → see "cannot message yourself" error
3. **Verify recipient experience**: Check that new conversation appears in their `/contacts/requests`
4. **Mobile responsive**: Test modal on mobile viewport
