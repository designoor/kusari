# Kusari Implementation Plan

This document provides a detailed, task-by-task implementation plan for the Kusari Web3 messaging application.

---

## Overview

| Phase | Status | Goal |
|-------|--------|----------|------|
| Phase 1 | ✅ DONE | Foundation: Setup, design tokens, UI components, wallet |
| Phase 2 | ✅ DONE | Onboarding: XMTP setup, 3-step flow |
| Phase 3 | ✅ DONE | Core Chat: Conversations, messages, real-time |
| Phase 4 | ⏳ Pending | Contacts: Management, Ethos reputation |
| Phase 5 | ⏳ Pending | Polish: Settings, errors, a11y, performance |

---

## Phase 4: Contacts & Reputation

### Task 4.1: Ethos Service (2 hours)

**Create:**
```
src/services/ethos/
├── api.ts
├── types.ts
└── index.ts

src/hooks/useEthosScore.ts
```

**API:**
```typescript
const ETHOS_BASE_URL = 'https://api.ethos.network/api/v2';

async function fetchEthosProfile(address: string): Promise<EthosProfile | null>
```

**EthosScoreData:**
```typescript
interface EthosScoreData {
  score: number;           // 3-4 digit value (e.g., 1250)
  reviews: {
    positive: number;
    negative: number;
    neutral: number;
  };
  profileUrl: string;
  isVerified: boolean;
}
```

**useEthosScore Hook:**
- Fetches score for address
- Caches results
- Returns { data, isLoading, error }

---

### Task 4.2: Reputation Components (2-3 hours)

**Create:**
```
src/components/reputation/
├── ReputationBadge/     # Compact: "⭐ 1250" or "Not verified"
├── EthosScore/          # Uses hook, renders badge
├── EthosReputationPanel/ # Detailed: score, reviews, link
└── index.ts
```

**ReputationBadge:** Compact display
**EthosReputationPanel:** Full stats with "View on Ethos" link

---

### Task 4.3: Contacts Components (3-4 hours)

**Create:**
```
src/components/contacts/
├── ContactSearch/
├── ContactSectionLink/
├── ContactList/
├── ContactItem/
├── ContactDetail/
├── ContactActions/
└── index.ts

src/hooks/useContacts.ts
src/hooks/useNewRequestsCount.ts
```

**useContacts:**
```typescript
function useContacts(): {
  accepted: ConversationPreview[];
  requests: ConversationPreview[];
  denied: ConversationPreview[];
  isLoading: boolean;
}
```

**useNewRequestsCount:**
```typescript
function useNewRequestsCount(): number
```

**ContactSectionLink:** "New requests (3)" style link
**ContactDetail:** Conversation history + EthosReputationPanel + Actions
**ContactActions:** Accept/Decline/Block/Unblock buttons

---

### Task 4.4: Contacts Pages (2-3 hours)

**Create:**
```
src/app/(app)/contacts/page.tsx          # Main with sections
src/app/(app)/contacts/requests/page.tsx # Pending list
src/app/(app)/contacts/denied/page.tsx   # Blocked list
src/app/(app)/contacts/[address]/page.tsx # Detail view
```

**Main Page Structure:**
```
[Search bar]
[New requests (3)]     → /contacts/requests
[Denied (2)]           → /contacts/denied
─────────────────
Accepted contacts list
```

---

### Task 4.5: MainNav Badge (30 minutes)

Update app layout to include badge:
```typescript
{ 
  id: 'contacts', 
  icon: <Icon name="contacts" />, 
  label: 'Contacts', 
  href: '/contacts',
  badge: requestsCount,  // from useNewRequestsCount
}
```

---

### Phase 4 Checklist

- [ ] Ethos API integration
- [ ] Score displays (3-4 digit values)
- [ ] Contacts page with sections
- [ ] Accept/Decline/Block work
- [ ] MainNav badge updates

---

## Phase 5: Polish

### Task 5.1: Settings Page (2 hours)

**Create:**
```
src/app/(app)/settings/page.tsx
```

**Sections:**
- Connected wallet (address, disconnect)
- App info (version)
- Support links

---

### Task 5.2: Error Handling (2 hours)

**Create:**
```
src/components/ErrorBoundary/
src/app/(app)/error.tsx
src/app/(app)/not-found.tsx
```

---

### Task 5.3: Loading States (1-2 hours)

**Create:**
```
src/app/(app)/loading.tsx
src/app/(app)/chat/loading.tsx
```

---

### Task 5.4: Accessibility Audit (2-3 hours)

- [ ] Keyboard navigation
- [ ] Focus management
- [ ] ARIA labels
- [ ] Color contrast
- [ ] Screen reader testing

---

### Task 5.5: Performance (2 hours)

- [ ] Bundle analysis
- [ ] Message virtualization
- [ ] Memo/useMemo optimization
- [ ] Image optimization

---

### Task 5.6: Production Config (1 hour)

```
.env.production
NEXT_PUBLIC_XMTP_ENV=production
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx
```

---

### Task 5.7: Final Testing (2-3 hours)

Full flow testing:
- [ ] Fresh onboarding
- [ ] Wallet connection
- [ ] XMTP signature
- [ ] Send/receive messages
- [ ] Contact accept/decline
- [ ] Ethos scores
- [ ] Mobile responsive
- [ ] Error states

---

## Deployment

1. Connect repo to Vercel
2. Set environment variables
3. Deploy
4. Verify all flows work

---

## Future Enhancements

1. ENS name resolution
2. Group chats
3. Rich content (attachments, reactions)
4. Payment gating
5. Push notifications
6. Message search
7. Database integration
