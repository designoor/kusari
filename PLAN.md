# Kusari Implementation Plan

This document provides a detailed, task-by-task implementation plan for the Kusari Web3 messaging application.

---

## Overview

| Phase | Duration | Goal |
|-------|----------|------|
| Phase 1 | 5 days | Foundation: Setup, design tokens, UI components, wallet |
| Phase 2 | 3 days | Onboarding: XMTP setup, 3-step flow |
| Phase 3 | 4-5 days | Core Chat: Conversations, messages, real-time |
| Phase 4 | 3-4 days | Contacts: Management, Ethos reputation |
| Phase 5 | 3-4 days | Polish: Settings, errors, a11y, performance |

**Total: 4-5 weeks**

---

## Phase 1: Foundation

### Task 1.1: Project Setup (2-3 hours)

**Dependencies:** None

**Create:**
```
kusari/
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.example
├── .env.local
├── .gitignore
└── src/app/layout.tsx
```

**Steps:**
1. `npx create-next-app@latest kusari --typescript --app --tailwind=false --eslint --src-dir`
2. `npm install zod`
3. Configure strict TypeScript
4. Setup environment variables

**Acceptance Criteria:**
- [ ] `npm run dev` runs without errors
- [ ] TypeScript strict mode enabled
- [ ] Basic page renders at localhost:3000

---

### Task 1.2: Design Tokens (2-3 hours)

**Dependencies:** 1.1

**Create:**
```
src/styles/
├── tokens.css      # CSS variables
├── reset.css       # CSS reset
└── globals.css     # Global styles
```

**Key Tokens:**
```css
/* Typography */
--font-size-sm: 12px;
--font-size-md: 14px;
--font-size-lg: 16px;
--font-size-xl: 20px;

/* Colors */
--color-content-primary: #FFFFFF;
--color-content-secondary: #A1A1A1;
--color-content-tertiary: #6B6B6B;
--color-bg-primary: #000000;
--color-accent: #5BFF8C;
--color-border: #2A2A2A;

/* Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

**Acceptance Criteria:**
- [ ] CSS variables accessible globally
- [ ] Dark theme applied (black bg, white text)

---

### Task 1.3: Icon Component (1-2 hours)

**Dependencies:** 1.2

**Create:**
```
src/components/ui/Icon/
├── Icon.tsx
├── Icon.module.css
└── index.ts

public/icons/
├── chat.svg
├── contacts.svg
├── settings.svg
├── send.svg
├── search.svg
├── chevron-left.svg
├── check.svg
├── x.svg
└── loader.svg
```

**Props:**
```typescript
interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg' | 'xl';  // 16, 20, 24, 32px
  className?: string;
  'aria-label'?: string;
}
```

**Acceptance Criteria:**
- [ ] Icons render at correct sizes
- [ ] Color inherits from parent
- [ ] Accessible (aria-label or aria-hidden)

---

### Task 1.4: Button Component (2-3 hours)

**Dependencies:** 1.2, 1.3

**Create:**
```
src/components/ui/Button/
├── Button.tsx
├── Button.module.css
└── index.ts
```

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}
```

**Styles:**
- Primary: accent bg (#5BFF8C), black text
- Secondary: transparent, white border
- Ghost: transparent, no border

**Acceptance Criteria:**
- [ ] 3 variants render correctly
- [ ] 3 sizes work (32px, 40px, 48px height)
- [ ] Loading state shows spinner
- [ ] Disabled state styled
- [ ] Hover/active states visible

---

### Task 1.5: Input Component (2 hours)

**Dependencies:** 1.2, 1.3

**Create:**
```
src/components/ui/Input/
├── Input.tsx
├── Input.module.css
└── index.ts
```

**Props:**
```typescript
interface InputProps {
  variant?: 'default' | 'search';
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  fullWidth?: boolean;
}
```

**Acceptance Criteria:**
- [ ] Default: square corners
- [ ] Search: pill shape
- [ ] Error state: red border + message
- [ ] Focus state: accent border
- [ ] Label and hint text work

---

### Task 1.6: Avatar Component (1-2 hours)

**Dependencies:** 1.2

**Create:**
```
src/components/ui/Avatar/
├── Avatar.tsx
├── Avatar.module.css
└── index.ts
```

**Props:**
```typescript
interface AvatarProps {
  src?: string | null;
  address?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';  // 24, 32, 40, 48px
}
```

**Features:**
- Show image if src provided
- Fallback: First 2 hex chars after 0x as initials
- Background color generated from address hash

**Acceptance Criteria:**
- [ ] Image loads correctly
- [ ] Fallback shows initials
- [ ] Consistent color per address
- [ ] Circular shape

---

### Task 1.7: Badge Component (1 hour)

**Dependencies:** 1.2

**Create:**
```
src/components/ui/Badge/
├── Badge.tsx
├── Badge.module.css
└── index.ts
```

**Props:**
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'md';
  count?: number;
  maxCount?: number;
  dot?: boolean;
}
```

**Acceptance Criteria:**
- [ ] Shows count (99+ for overflow)
- [ ] Dot variant (no text)
- [ ] Color variants work

---

### Task 1.8: Skeleton Component (30 minutes)

**Dependencies:** 1.2

**Create:**
```
src/components/ui/Skeleton/
├── Skeleton.tsx
├── Skeleton.module.css
└── index.ts
```

**Props:**
```typescript
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
}
```

**Acceptance Criteria:**
- [ ] Shimmer animation
- [ ] 3 shape variants

---

### Task 1.9: EmptyState Component (30 minutes)

**Dependencies:** 1.2, 1.4

**Create:**
```
src/components/ui/EmptyState/
├── EmptyState.tsx
├── EmptyState.module.css
└── index.ts
```

**Props:**
```typescript
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}
```

**Acceptance Criteria:**
- [ ] Centered layout
- [ ] Optional icon, description, action

---

### Task 1.10: Modal Component (1-2 hours)

**Dependencies:** 1.2, 1.3, 1.4

**Create:**
```
src/components/ui/Modal/
├── Modal.tsx
├── Modal.module.css
└── index.ts
```

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- Portal to body
- Escape key closes
- Click overlay closes (configurable)
- Focus trap
- Body scroll lock

**Acceptance Criteria:**
- [ ] Renders via portal
- [ ] Keyboard accessible
- [ ] Animations work

---

### Task 1.11: UI Components Index (15 minutes)

**Create:**
```typescript
// src/components/ui/index.ts
export * from './Icon';
export * from './Button';
export * from './Input';
export * from './Avatar';
export * from './Badge';
export * from './Skeleton';
export * from './EmptyState';
export * from './Modal';
```

---

### Task 1.12: MainNav Component (3-4 hours)

**Dependencies:** 1.3, 1.7

**Create:**
```
src/components/layout/MainNav/
├── MainNav.tsx
├── MainNav.module.css
├── NavItem.tsx
└── index.ts
```

**Props:**
```typescript
interface NavItemData {
  id: string;
  icon: ReactNode;
  label: string;
  href: string;
  badge?: number;
}

interface MainNavProps {
  items: NavItemData[];
  orientation: 'vertical' | 'horizontal';
  logo?: ReactNode;
}
```

**Behavior:**
- Vertical (desktop): 72px wide sidebar, icons + labels
- Horizontal (mobile): 64px tall bottom bar, icons only
- Badge support for notification counts
- Active state via usePathname()

**Acceptance Criteria:**
- [ ] Both orientations work
- [ ] Logo only in vertical
- [ ] Badges render correctly
- [ ] Active item highlighted

---

### Task 1.13: AppShell Component (2 hours)

**Dependencies:** 1.12

**Create:**
```
src/components/layout/AppShell/
├── AppShell.tsx
├── AppShell.module.css
└── index.ts

src/hooks/useMediaQuery.ts
```

**useMediaQuery Hook:**
```typescript
export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)');
}
```

**AppShell Behavior:**
- Desktop (≥768px): Vertical sidebar on left
- Mobile (<768px): Horizontal bottom nav

**Acceptance Criteria:**
- [ ] Responsive layout switching
- [ ] Full viewport height
- [ ] Content area scrollable

---

### Task 1.14: Wallet Connection (3-4 hours)

**Dependencies:** 1.1

**Install:**
```bash
npm install wagmi viem @tanstack/react-query @web3modal/wagmi
```

**Create:**
```
src/lib/wallet/config.ts
src/providers/WalletProvider.tsx
src/hooks/useWallet.ts
```

**useWallet Hook:**
```typescript
interface WalletState {
  address: string | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
}
```

**Acceptance Criteria:**
- [ ] WalletConnect modal opens
- [ ] Browser wallets work
- [ ] Mobile deep links work
- [ ] Connection state accessible
- [ ] Disconnect works

---

### Task 1.15: Hooks Index (10 minutes)

**Create:**
```typescript
// src/hooks/index.ts
export * from './useMediaQuery';
export * from './useWallet';
```

---

### Phase 1 Checklist

- [ ] Project runs without errors
- [ ] All UI components functional
- [ ] Design tokens applied
- [ ] MainNav works both orientations
- [ ] AppShell responsive
- [ ] Wallet connection working
- [ ] No TypeScript errors

---

## Phase 2: Onboarding

### Task 2.1: XMTP Service (2-3 hours)

**Dependencies:** Phase 1

**Install:**
```bash
npm install @xmtp/browser-sdk
```

**Create:**
```
src/services/xmtp/
├── client.ts       # Client factory
├── signer.ts       # Wagmi to XMTP signer adapter
├── types.ts        # TypeScript types
└── index.ts

src/providers/XmtpProvider.tsx
src/hooks/useXmtp.ts
```

**Signer Adapter:**
```typescript
export function createXmtpSigner(
  walletClient: WalletClient,
  address: string
): Signer {
  return {
    type: 'EOA',
    getIdentifier: () => ({
      identifier: address,
      identifierKind: 'Ethereum',
    }),
    signMessage: async (message: string) => {
      const signature = await walletClient.signMessage({
        account: address as `0x${string}`,
        message,
      });
      return hexToBytes(signature);
    },
  };
}
```

**XmtpProvider State:**
```typescript
interface XmtpState {
  client: Client | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
}
```

**Acceptance Criteria:**
- [ ] Signer adapter works with wagmi
- [ ] Client initializes with env config
- [ ] Provider manages state
- [ ] Hook provides access

---

### Task 2.2: Onboarding State (1 hour)

**Dependencies:** 2.1

**Create:**
```
src/lib/onboarding/storage.ts
src/hooks/useOnboardingState.ts
```

**Storage Functions:**
- `isOnboardingComplete()` → boolean
- `setOnboardingComplete()` → void
- `getCurrentStep()` → number
- `setCurrentStep(n)` → void
- `clearOnboardingState()` → void

**Hook:**
```typescript
interface OnboardingState {
  isComplete: boolean;
  currentStep: 'welcome' | 'connect' | 'sign';
  stepIndex: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => void;
}
```

**Acceptance Criteria:**
- [ ] State persists to localStorage
- [ ] Navigation between steps works
- [ ] Completion tracked

---

### Task 2.3: Onboarding Components (3-4 hours)

**Dependencies:** 2.2

**Create:**
```
src/components/onboarding/
├── OnboardingFlow/
├── StepIndicator/
├── WelcomeStep/
├── ConnectWalletStep/
├── SignMessageStep/
└── index.ts
```

**StepIndicator:** Progress dots showing current step

**WelcomeStep:**
- Explain Kusari benefits
- "Get Started" button → next

**ConnectWalletStep:**
- Trigger WalletConnect
- Auto-advance when connected

**SignMessageStep:**
- Explain XMTP signature
- "Sign & Enable" button
- Initialize XMTP client
- On success → complete

**OnboardingFlow:**
- Container orchestrating steps
- Uses useOnboardingState

**Acceptance Criteria:**
- [ ] All 3 steps functional
- [ ] Can't skip connect/sign
- [ ] Error handling for failures
- [ ] Completion redirects to /chat

---

### Task 2.4: Landing Page (1 hour)

**Dependencies:** 2.3

**Update:** `src/app/page.tsx`

**Logic:**
1. If onboarding complete + connected + initialized → redirect /chat
2. Else → show OnboardingFlow

**Acceptance Criteria:**
- [ ] New users see onboarding
- [ ] Returning users redirected
- [ ] Edge cases handled

---

### Phase 2 Checklist

- [ ] XMTP client initializes
- [ ] Signer works with wallet
- [ ] 3-step flow functional
- [ ] State persists
- [ ] Completion redirects

---

## Phase 3: Core Chat

### Task 3.1: XMTP Services (2-3 hours)

**Dependencies:** Phase 2

**Create:**
```
src/services/xmtp/
├── conversations.ts
├── messages.ts
└── consent.ts
```

**Conversations Service:**
```typescript
export async function listConversations(
  client: Client,
  consentStates?: ConsentState[]
): Promise<ConversationWithPeer[]>

export function streamConversations(
  client: Client,
  onConversation: (conversation: Conversation) => void
): () => void
```

**Messages Service:**
```typescript
export async function listMessages(conversation: Conversation): Promise<DecodedMessage[]>
export async function sendMessage(conversation: Conversation, content: string): Promise<DecodedMessage>
export function streamMessages(conversation: Conversation, onMessage: (msg: DecodedMessage) => void): () => void
```

**Consent Service:**
```typescript
export async function allowContact(client: Client, peerInboxId: string): Promise<void>
export async function denyContact(client: Client, peerInboxId: string): Promise<void>
export async function getConsentState(client: Client, peerInboxId: string): Promise<ConsentState>
```

**Acceptance Criteria:**
- [ ] List/stream conversations
- [ ] List/stream/send messages
- [ ] Consent management

---

### Task 3.2: Chat Hooks (2-3 hours)

**Dependencies:** 3.1

**Create:**
```
src/hooks/useConversations.ts
src/hooks/useMessages.ts
src/hooks/useConsent.ts
```

**useConversations:**
```typescript
interface ConversationPreview {
  id: string;
  conversation: Conversation;
  peerAddress: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  consentState: ConsentState;
}

function useConversations(options?: {
  consentStates?: ConsentState[];
}): {
  conversations: ConversationPreview[];
  isLoading: boolean;
  error: Error | null;
}
```

**useMessages:**
```typescript
interface Message {
  id: string;
  content: string;
  senderAddress: string;
  sentAt: Date;
  isSelf: boolean;
}

function useMessages(
  conversation: Conversation | null,
  selfAddress: string | undefined
): {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  send: (content: string) => Promise<void>;
}
```

**useConsent:**
```typescript
function useConsent(): {
  allow: (peerInboxId: string) => Promise<void>;
  deny: (peerInboxId: string) => Promise<void>;
  getState: (peerInboxId: string) => Promise<ConsentState>;
}
```

**Acceptance Criteria:**
- [ ] Real-time conversation updates
- [ ] Real-time message updates
- [ ] Send messages
- [ ] Consent actions work

---

### Task 3.3: Utility Functions (1 hour)

**Create:**
```
src/lib/address.ts
src/lib/time.ts
```

**Address Utils:**
```typescript
truncateAddress(address: string, start?: number, end?: number): string
isValidAddress(address: string): boolean
```

**Time Utils:**
```typescript
formatTime(date: Date): string          // "2:30 PM"
formatRelativeTime(date: Date): string  // "5m", "2h", "3d"
```

---

### Task 3.4: Chat Components (4-5 hours)

**Dependencies:** 3.2, 3.3

**Create:**
```
src/components/chat/
├── ConversationList/
├── ConversationItem/
├── MessageList/
├── MessageBubble/
├── MessageInput/
├── ChatHeader/
├── ChatView/
└── index.ts
```

**ConversationItem:** Avatar, address, last message, time, unread badge
**ConversationList:** Scrollable list of ConversationItem
**MessageBubble:** Self (accent bg, right) vs Other (dark bg, left)
**MessageList:** Scrollable, auto-scroll to bottom
**MessageInput:** Textarea + send button, Enter to send
**ChatHeader:** Avatar, address, back button (mobile)
**ChatView:** Combines header, messages, input

**Acceptance Criteria:**
- [ ] List shows conversations with previews
- [ ] Messages display correctly
- [ ] Send works
- [ ] Real-time updates
- [ ] Loading/empty states

---

### Task 3.5: Chat Pages (2-3 hours)

**Dependencies:** 3.4

**Create:**
```
src/app/(app)/layout.tsx           # App shell with auth guard
src/app/(app)/chat/page.tsx        # Conversation list
src/app/(app)/chat/[conversationId]/page.tsx  # Active conversation
```

**Layout:**
- Wrap with AppShell
- Auth guard: redirect to / if not setup

**Chat List Page:**
- Show ConversationList (allowed only)
- Desktop: Split view, right shows "Select conversation"
- Mobile: Full width list

**Conversation Page:**
- Desktop: Split view, active conversation shown
- Mobile: Full screen chat with back button

**Acceptance Criteria:**
- [ ] Desktop split layout
- [ ] Mobile full-screen views
- [ ] URL updates on navigation
- [ ] Auth guard works

---

### Phase 3 Checklist

- [ ] Services work correctly
- [ ] Real-time streaming functional
- [ ] UI components complete
- [ ] Desktop/mobile layouts work
- [ ] Messages send/receive

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
