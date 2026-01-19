# Kusari - Web3 Messaging Client

## Project Overview

Kusari is a decentralized messaging application built on XMTP protocol, enabling Web3 identities to communicate securely. The app integrates with Ethos Network to display reputation scores, helping users make informed decisions about accepting message requests from unknown contacts.

### Core Value Proposition

- **Trust-Based Messaging**: Users can review sender reputation (via Ethos) before accepting conversations
- **Spam-Free Inbox**: Only messages from accepted contacts appear in the main chat view
- **Web3 Native**: Wallet-based identity, no email/password required
- **Privacy-First**: End-to-end encrypted messages via XMTP

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14+ (App Router) | Full-stack React framework |
| Language | TypeScript | Strict typing throughout |
| Messaging | XMTP Browser SDK | Decentralized messaging protocol |
| Wallet | WalletConnect v2 + wagmi | Browser & mobile wallet connections |
| Validation | Zod | Runtime schema validation for API |
| Styling | CSS Modules | Scoped, maintainable styles |
| Hosting | Vercel | Deployment platform |
| Database | Deferred | Will evaluate Drizzle + Neon when needed |

### External Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| XMTP Network | Message transport & storage | https://docs.xmtp.org |
| Ethos Network | Reputation scores | https://developers.ethos.network |
| WalletConnect | Wallet connections | https://docs.walletconnect.com |

---

## Architecture Principles

### 1. Strong Typing
- All code must be fully typed with TypeScript
- No `any` types except in truly unavoidable edge cases (must be documented)
- Zod schemas for all API inputs with inferred types
- Discriminated unions for state management

### 2. Modular & Extensible
- Current MVP: 1:1 text messaging
- Architecture must support future additions:
  - Group conversations
  - Rich content types (attachments, reactions, replies)
  - Payment-gated messaging
- Use abstractions that don't lock us into current limitations

### 3. Reusable Components
- All UI primitives (Button, Input, Tabs, Icons, etc.) must be designed as reusable components
- Components should be configurable via props, not one-off implementations
- Maintain a component library mindset from day one

### 4. Clean Separation
- UI components: Pure presentation, no business logic
- Hooks: Business logic, state management, side effects
- Services: External API interactions (XMTP, Ethos, etc.)
- Types: Shared type definitions

---

## Design System

### Typography Scale

```css
--font-size-sm: 12px;    /* Small - labels, captions, timestamps */
--font-size-md: 14px;    /* Medium - body text, messages */
--font-size-lg: 16px;    /* Large - headings, emphasis */
--font-size-xl: 20px;    /* Extra Large - page titles */
```

### Color Palette

```css
/* Content Colors */
--color-content-primary: #FFFFFF;      /* White - primary text */
--color-content-secondary: #A1A1A1;    /* Light Gray - secondary text */
--color-content-tertiary: #6B6B6B;     /* Gray - disabled, hints */

/* Background */
--color-bg-primary: #000000;           /* Pure black - main background */
--color-bg-secondary: #0A0A0A;         /* Slight elevation */
--color-bg-tertiary: #141414;          /* Cards, panels */

/* Accent */
--color-accent: #5BFF8C;               /* Primary accent - buttons, highlights */
--color-accent-hover: #4DE67D;         /* Accent hover state */

/* Borders */
--color-border: #2A2A2A;               /* Border color */

/* Semantic */
--color-error: #FF5B5B;                /* Error states */
--color-success: #5BFF8C;              /* Success (same as accent) */
--color-warning: #FFB85B;              /* Warning states */
```

### Interactive Elements

| Element | Default State | Hover State | Active State |
|---------|---------------|-------------|--------------|
| Primary Button | Accent bg, black text | Accent-hover bg | Pressed effect |
| Secondary Button | Transparent, white border | White bg 10% | Pressed effect |
| Link/Clickable Text | White, dotted underline | Accent color | — |
| Tab (inactive) | Content-tertiary | Content-secondary | — |
| Tab (active) | Content-primary | — | — |

### Spacing Scale

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

---

## Application Structure

### File Organization

```
kusari/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Landing/onboarding
│   │   ├── chat/
│   │   │   ├── page.tsx          # Chat list view
│   │   │   └── [conversationId]/
│   │   │       └── page.tsx      # Individual conversation
│   │   ├── contacts/
│   │   │   ├── page.tsx          # Contacts list view
│   │   │   ├── requests/
│   │   │   │   └── page.tsx      # New message requests list
│   │   │   ├── denied/
│   │   │   │   └── page.tsx      # Denied contacts list
│   │   │   └── [address]/
│   │   │       └── page.tsx      # Contact detail view
│   │   ├── settings/
│   │   │   └── page.tsx          # Settings page
│   │   └── api/                   # API routes (if needed)
│   │
│   ├── components/
│   │   ├── ui/                    # Reusable UI primitives
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.module.css
│   │   │   │   └── index.ts
│   │   │   ├── Input/
│   │   │   ├── Icon/
│   │   │   ├── Avatar/
│   │   │   ├── Badge/
│   │   │   ├── Tabs/
│   │   │   ├── Modal/
│   │   │   └── ...
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── MainNav/           # Primary navigation (vertical/horizontal)
│   │   │   ├── AppShell/
│   │   │   └── ...
│   │   │
│   │   ├── chat/                  # Chat-specific components
│   │   │   ├── ConversationList/
│   │   │   ├── ConversationItem/
│   │   │   ├── MessageList/
│   │   │   ├── MessageBubble/
│   │   │   ├── MessageInput/
│   │   │   └── ...
│   │   │
│   │   ├── contacts/              # Contacts-specific components
│   │   │   ├── ContactSearch/
│   │   │   ├── ContactSectionLink/
│   │   │   ├── ContactList/
│   │   │   ├── ContactItem/
│   │   │   ├── ContactDetail/
│   │   │   ├── ContactActions/
│   │   │   └── ...
│   │   │
│   │   ├── onboarding/            # Onboarding flow components
│   │   │   ├── OnboardingFlow/
│   │   │   ├── WelcomeStep/
│   │   │   ├── ConnectWalletStep/
│   │   │   ├── SignMessageStep/
│   │   │   └── ...
│   │   │
│   │   └── reputation/            # Ethos integration components
│   │       ├── EthosScore/
│   │       ├── ReputationBadge/
│   │       └── ...
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useXmtp.ts             # XMTP client management
│   │   ├── useConversations.ts    # Conversation list & streaming
│   │   ├── useMessages.ts         # Message list & streaming
│   │   ├── useConsent.ts          # Consent state management
│   │   ├── useContacts.ts         # Contacts list (grouped by consent)
│   │   ├── useEthosScore.ts       # Ethos API integration
│   │   ├── useWallet.ts           # Wallet connection state
│   │   ├── useMediaQuery.ts       # Responsive breakpoints
│   │   └── useNewRequestsCount.ts # Badge count for MainNav
│   │
│   ├── services/                  # External service integrations
│   │   ├── xmtp/
│   │   │   ├── client.ts          # XMTP client creation
│   │   │   ├── conversations.ts   # Conversation operations
│   │   │   ├── messages.ts        # Message operations
│   │   │   └── consent.ts         # Consent operations
│   │   │
│   │   └── ethos/
│   │       ├── api.ts             # Ethos API client
│   │       └── types.ts           # Ethos response types
│   │
│   ├── providers/                 # React context providers
│   │   ├── WalletProvider.tsx     # wagmi + WalletConnect setup
│   │   ├── XmtpProvider.tsx       # XMTP client context
│   │   └── ThemeProvider.tsx      # Theme/design tokens
│   │
│   ├── types/                     # Shared TypeScript types
│   │   ├── conversation.ts
│   │   ├── message.ts
│   │   ├── user.ts
│   │   └── consent.ts
│   │
│   ├── lib/                       # Utility functions
│   │   ├── address.ts             # Address formatting, ENS
│   │   ├── time.ts                # Date/time formatting
│   │   └── validation.ts          # Zod schemas
│   │
│   └── styles/                    # Global styles
│       ├── globals.css            # CSS reset, variables
│       └── tokens.css             # Design token definitions
│
├── public/
│   └── icons/                     # SVG icons
│
├── .env.local                     # Environment variables
├── .env.example                   # Example env file
├── next.config.js
├── tsconfig.json
├── package.json
└── CLAUDE.md
```

---

## User Flows

### 1. Onboarding Flow

```
[Landing Page]
     │
     ▼
┌─────────────────────────────────────┐
│  Step 1: Welcome                    │
│  - Explain what Kusari is           │
│  - Benefits of Web3 messaging       │
│  - "Get Started" button             │
│  (skippable: NO)                    │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Step 2: Connect Wallet             │
│  - WalletConnect modal              │
│  - Support browser + mobile wallets │
│  - Show connected address           │
│  (skippable: NO)                    │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Step 3: Enable Messaging           │
│  - Explain XMTP signature           │
│  - Sign message to create keys      │
│  - "Enable Secure Messaging" button │
│  (skippable: NO)                    │
└─────────────────────────────────────┘
     │
     ▼
[Redirect to /chat]
```

**State Persistence**: Store onboarding completion in localStorage. If user returns with connected wallet + valid XMTP keys, skip onboarding.

### 2. Main Chat Flow

```
/chat
  │
  ├── Desktop View:
  │   ┌──────┬─────────────────┬──────────────────────────┐
  │   │ Main │ Conversation    │ Active Conversation      │
  │   │ Nav  │ List            │                          │
  │   │      │                 │                          │
  │   │ [●]  │ ┌─────────────┐ │  ┌────────────────────┐  │
  │   │ logo │ │ Alice       │ │  │ Messages...        │  │
  │   │      │ │ Last msg... │ │  │                    │  │
  │   │ [💬] │ └─────────────┘ │  │                    │  │
  │   │ chat │ ┌─────────────┐ │  │                    │  │
  │   │      │ │ Bob         │ │  └────────────────────┘  │
  │   │ [👥] │ │ Last msg... │ │  ┌────────────────────┐  │
  │   │ contacts (badge)     │ │  │ [Message input]    │  │
  │   │      │ └─────────────┘ │  └────────────────────┘  │
  │   │ [⚙️] │                 │                          │
  │   │ settings              │                          │
  │   └──────┴─────────────────┴──────────────────────────┘
  │
  └── Mobile View:
      /chat → List only (full screen)
      /chat/[id] → Conversation only (full screen, back button)
      
      Bottom nav: [💬 Chat] [👥 Contacts*] [⚙️ Settings]
      * Shows badge when new requests pending
```

### 3. Contacts Flow

```
/contacts
  │
  ├── Structure:
  │   ┌─────────────────────────────┐
  │   │ 🔍 [Search contacts...]     │  ← Search bar
  │   ├─────────────────────────────┤
  │   │ 📩 New requests        (3)  │  ← Link to /contacts/requests
  │   ├─────────────────────────────┤
  │   │ 🚫 Denied requests     (2)  │  ← Link to /contacts/denied
  │   ├─────────────────────────────┤
  │   │ ─── Accepted Contacts ───── │
  │   │ ┌─────────────────────────┐ │
  │   │ │ 👤 Alice.eth           │ │  ← Accepted contact
  │   │ └─────────────────────────┘ │
  │   │ ┌─────────────────────────┐ │
  │   │ │ 👤 0x1234...5678       │ │  ← Accepted contact
  │   │ └─────────────────────────┘ │
  │   └─────────────────────────────┘
  │
  ├── /contacts/requests
  │   │
  │   ├── List of pending requests (consent = "unknown")
  │   │   Each item shows:
  │   │   - Sender address (truncated)
  │   │   - Ethos score badge (or "Not verified")
  │   │   - First message preview
  │   │   - Timestamp
  │   │
  │   └── Clicking item → /contacts/[address]
  │
  ├── /contacts/denied
  │   │
  │   ├── List of denied contacts (consent = "denied")
  │   │   Each item shows:
  │   │   - Address
  │   │   - Option to unblock
  │   │
  │   └── Clicking item → /contacts/[address]
  │
  └── /contacts/[address]
      │
      ├── Contact Detail View:
      │   - Full conversation history
      │   - Ethos reputation panel:
      │     - Numeric score (3-4 digits)
      │     - Review count (positive/negative/neutral)
      │     - Link to Ethos profile
      │
      └── Action buttons (based on consent state):
          If unknown: [Accept] [Decline]
          If allowed: [Block Contact]
          If denied:  [Unblock Contact]
          
          Accept → Set consent to "allowed", redirect to /chat/[conversationId]
          Decline/Block → Set consent to "denied", redirect to /contacts
          Unblock → Set consent to "allowed"
```

### 4. Settings Flow

```
/settings
  │
  ├── Profile Section
  │   - Connected wallet address
  │   - Disconnect wallet option
  │
  ├── Messaging Section (future)
  │   - Payment requirements for new contacts
  │
  └── About Section
      - Version info
      - Links to docs/support
```

---

## XMTP Integration

### Environment Configuration

```typescript
// Development: Local XMTP node
NEXT_PUBLIC_XMTP_ENV=local
NEXT_PUBLIC_XMTP_API_URL=http://localhost:5556

// Production: XMTP production network
NEXT_PUBLIC_XMTP_ENV=production
```

### Client Initialization

```typescript
// src/services/xmtp/client.ts
import { Client } from '@xmtp/browser-sdk';
import type { Signer } from '@xmtp/browser-sdk';

export async function createXmtpClient(signer: Signer): Promise<Client> {
  const env = process.env.NEXT_PUBLIC_XMTP_ENV === 'production' 
    ? 'production' 
    : 'local';
    
  const client = await Client.create(signer, {
    env,
    // Additional options as needed
  });
  
  return client;
}
```

### Consent States

XMTP provides three consent states that we leverage:

| State | Meaning | UI Location |
|-------|---------|-------------|
| `allowed` | User accepted this contact | Main chat list (`/chat`) + Contacts list |
| `unknown` | New/pending contact | Contacts → New requests (`/contacts/requests`) |
| `denied` | User blocked this contact | Contacts → Denied (`/contacts/denied`) |

```typescript
// src/types/consent.ts
export type ConsentState = 'allowed' | 'unknown' | 'denied';

export interface ConsentAction {
  type: 'allow' | 'deny';
  inboxId: string;
}
```

### Message Streaming

Real-time updates via XMTP streams:

```typescript
// src/hooks/useMessages.ts
export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const client = useXmtpClient();
  
  useEffect(() => {
    if (!client || !conversationId) return;
    
    const conversation = /* get conversation */;
    
    // Stream new messages
    const stream = conversation.streamMessages();
    
    (async () => {
      for await (const message of stream) {
        setMessages(prev => [...prev, message]);
      }
    })();
    
    return () => {
      stream.return(undefined);
    };
  }, [client, conversationId]);
  
  return messages;
}
```

### Extensibility Notes

**For future group chat support:**
- Use `client.conversations.newGroup()` instead of DM methods
- Group-specific: permissions, metadata, member management
- UI will need group creation flow, member list, admin controls

**For future rich content types:**
- XMTP content types are modular
- Install additional codecs: `@xmtp/content-type-*`
- MessageBubble component should handle content type switching

---

## Ethos Integration

### API Endpoint

Base URL: `https://api.ethos.network/api/v2`

Required header: `X-Ethos-Client: kusari@1.0.0`

### Fetching Reputation Score

```typescript
// src/services/ethos/api.ts
const ETHOS_BASE_URL = 'https://api.ethos.network/api/v2';

export interface EthosProfile {
  id: number;
  profileId: number | null;
  displayName: string;
  username: string | null;
  avatarUrl: string;
  description: string | null;
  score: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MERGED';
  stats: {
    review: {
      received: {
        negative: number;
        neutral: number;
        positive: number;
      };
    };
    vouch: {
      given: { amountWeiTotal: bigint; count: number };
      received: { amountWeiTotal: bigint; count: number };
    };
  };
  links: {
    profile: string;
    scoreBreakdown: string;
  };
}

export async function getEthosProfile(
  address: string
): Promise<EthosProfile | null> {
  const userkey = `address:${address}`;
  
  try {
    const response = await fetch(
      `${ETHOS_BASE_URL}/profiles/${encodeURIComponent(userkey)}`,
      {
        headers: {
          'X-Ethos-Client': 'kusari@1.0.0',
        },
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Ethos API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to fetch Ethos profile:', error);
    return null;
  }
}
```

### UI Display

```typescript
// src/components/reputation/EthosScore.tsx
interface EthosScoreProps {
  address: string;
}

// Display states:
// 1. Loading: Skeleton/spinner
// 2. Has profile: Score badge + review counts + profile link
// 3. No profile: "Not verified" badge
```

**Score Badge Component:**
- Shows numeric score (typically 3-4 digit values, e.g., 1250, 890)
- Color coding based on score threshold (optional)
- Clickable → opens Ethos profile in new tab

**Review Counts:**
- Format: "👍 12 | 👎 2 | 😐 5" or similar
- Compact display for conversation list
- Expanded display for request review page

---

## Responsive Design

### Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

### Layout Behavior

| Viewport | Sidebar | Conversation List | Chat Panel |
|----------|---------|-------------------|------------|
| < 768px | Hidden (bottom nav) | Full width OR hidden | Full width |
| ≥ 768px | Visible (icons) | ~280px | Remaining |
| ≥ 1024px | Visible (icons) | ~320px | Remaining |

### Mobile Navigation

Bottom navigation (horizontal MainNav) with 3 items:
1. **Chat** (💬) → `/chat`
2. **Contacts** (👥) → `/contacts` (with badge count for pending requests)
3. **Settings** (⚙️) → `/settings`

### Desktop Navigation

Left sidebar (vertical MainNav) with:
1. **Logo** (●) → App logo/home
2. **Chat** (💬) → `/chat`
3. **Contacts** (👥) → `/contacts` (with badge count for pending requests)
4. **Settings** (⚙️) → `/settings`

### Navigation Patterns

| Route | Desktop | Mobile |
|-------|---------|--------|
| `/chat` | Split view | List only |
| `/chat/[id]` | Split view (conversation selected) | Chat only + back button |
| `/contacts` | Full page with sections | Full page with sections |
| `/contacts/requests` | Request list | Request list + back button |
| `/contacts/denied` | Denied list | Denied list + back button |
| `/contacts/[address]` | Contact detail | Contact detail + back button |
| `/settings` | Full page (no split) | Full page |

---

## Component Specifications

### UI Primitives

All primitive components must follow this pattern:

```typescript
// Example: Button component

// Types
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

// Component should:
// 1. Use CSS Modules for styling
// 2. Forward refs when appropriate
// 3. Handle all interactive states (hover, active, disabled, loading)
// 4. Be fully accessible (ARIA attributes, keyboard navigation)
```

**Required UI Components (MVP):**

| Component | Variants/Props | Notes |
|-----------|---------------|-------|
| `Button` | primary, secondary, ghost; sm, md, lg | Loading state with spinner |
| `Input` | text, search; error state | With optional label |
| `Avatar` | size variants; fallback to initials | Address-based color generation |
| `Badge` | color variants; with/without count | For scores, notification counts |
| `Icon` | Wrapper for SVG icons | Consistent sizing |
| `Tabs` | Horizontal tab group | For in-page tab switching (NOT navigation) |
| `Modal` | Basic modal with overlay | For confirmations |
| `Skeleton` | Loading placeholder | For async content |
| `EmptyState` | Icon + message + optional CTA | For empty lists |

### MainNav Component

The `MainNav` is the primary application navigation component. It is **NOT** a standard tab bar—it's a dedicated navigation component that:

- Renders as a **vertical sidebar** on desktop (icons + optional labels)
- Renders as a **horizontal bottom bar** on mobile (icons only)
- Controls the main app sections via URL navigation (not just view switching)
- Supports notification badges on nav items

```typescript
// src/components/layout/MainNav/MainNav.tsx

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;        // Optional notification count
  showBadge?: boolean;   // Show dot badge without count
}

interface MainNavProps {
  items: NavItem[];
  activeItemId: string;
  orientation: 'vertical' | 'horizontal';  // Determined by viewport
  showLogo?: boolean;    // Only on desktop (vertical)
}

// Usage:
const navItems: NavItem[] = [
  { id: 'chat', icon: <ChatIcon />, label: 'Chat', href: '/chat' },
  { id: 'contacts', icon: <ContactsIcon />, label: 'Contacts', href: '/contacts', badge: 3 },
  { id: 'settings', icon: <SettingsIcon />, label: 'Settings', href: '/settings' },
];

// The component internally handles:
// - Vertical layout with logo for desktop
// - Horizontal layout without logo for mobile
// - Active state highlighting
// - Badge rendering
// - Navigation via Next.js Link
```

**Key Differences from Tabs:**

| Aspect | MainNav | Tabs |
|--------|---------|------|
| Purpose | App-level navigation | In-page content switching |
| URL | Changes URL/route | May or may not change URL |
| Layout | Vertical (desktop) / Horizontal (mobile) | Always horizontal |
| Position | Fixed sidebar / Fixed bottom | Inline with content |
| Badges | Supports notification badges | Typically no badges |
| Logo | Includes logo slot (desktop) | No logo |

### Chat Components

| Component | Purpose |
|-----------|---------|
| `ConversationList` | Scrollable list with search |
| `ConversationItem` | Avatar, name/address, preview, timestamp, unread indicator |
| `MessageList` | Virtualized message list (for performance) |
| `MessageBubble` | Single message; sent vs received styling |
| `MessageInput` | Text input with send button |
| `ChatHeader` | Recipient info, back button (mobile) |

### Contacts Components

| Component | Purpose |
|-----------|---------|
| `ContactsPage` | Main contacts view with search + sections |
| `ContactSearch` | Search input for filtering contacts |
| `ContactSectionLink` | "New requests (3)" / "Denied (2)" navigable items |
| `ContactList` | List of accepted contacts |
| `ContactItem` | Avatar, name/address, Ethos score preview |
| `ContactDetail` | Full contact view with conversation history |
| `EthosReputationPanel` | Score, reviews, profile link (for contact detail) |
| `ContactActions` | Accept/Decline/Block/Unblock buttons |

### Onboarding Components

| Component | Purpose |
|-----------|---------|
| `OnboardingFlow` | Multi-step container with progress |
| `StepIndicator` | Visual progress dots/bar |
| `WelcomeStep` | Introduction content |
| `ConnectWalletStep` | WalletConnect integration |
| `SignMessageStep` | XMTP signature prompt |

---

## State Management

### Global State (React Context)

```typescript
// Wallet State
interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

// XMTP State
interface XmtpState {
  client: Client | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: Error | null;
  initialize: (signer: Signer) => Promise<void>;
}
```

### Local State Patterns

Use React Query or similar for server state (Ethos API calls).
Use `useState`/`useReducer` for UI state.

---

## API Routes (If Needed)

For MVP, most logic runs client-side. API routes may be added for:

1. **Ethos proxy** (optional): Avoid CORS, add caching
2. **Analytics** (future): Track usage
3. **Payment verification** (future): Verify payment before allowing messages

```typescript
// Example: src/app/api/ethos/[address]/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

const ParamsSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const result = ParamsSchema.safeParse(params);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }
  
  // Fetch from Ethos, cache response
  // Return to client
}
```

---

## Environment Variables

```bash
# .env.example

# XMTP Configuration
NEXT_PUBLIC_XMTP_ENV=local              # 'local' | 'production'

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # From cloud.walletconnect.com

# Ethos (optional, for server-side proxy)
ETHOS_API_URL=https://api.ethos.network/api/v2

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Project setup (Next.js, TypeScript, CSS Modules)
- [ ] Design system implementation (tokens, global styles)
- [ ] UI primitive components (Button, Input, Avatar, Badge, Icon)
- [ ] MainNav component (vertical + horizontal modes)
- [ ] Layout components (AppShell)
- [ ] Wallet connection (WalletConnect v2 + wagmi)

### Phase 2: Onboarding (Week 2)

- [ ] Onboarding flow container
- [ ] Welcome step
- [ ] Connect wallet step
- [ ] Sign message step (XMTP key generation)
- [ ] Onboarding state persistence

### Phase 3: Core Chat (Week 2-3)

- [ ] XMTP client initialization
- [ ] Conversation list (allowed contacts only)
- [ ] Real-time conversation streaming
- [ ] Individual conversation view
- [ ] Message list with real-time updates
- [ ] Message sending
- [ ] Responsive layout (desktop split, mobile full-screen)

### Phase 4: Contacts & Reputation (Week 3)

- [ ] Contacts page structure (search, sections, list)
- [ ] New requests view (unknown consent contacts)
- [ ] Denied contacts view
- [ ] Contact detail view with conversation history
- [ ] Ethos API integration
- [ ] Reputation display components (EthosReputationPanel)
- [ ] Accept/Decline/Block/Unblock actions
- [ ] Consent state management
- [ ] MainNav badge for new requests

### Phase 5: Polish (Week 4)

- [ ] Settings page
- [ ] Empty states
- [ ] Loading states
- [ ] Error handling
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Mobile testing

### Phase 6: Future Enhancements

- [ ] ENS name resolution
- [ ] Group chat support
- [ ] Rich content types
- [ ] Payment-gated messaging
- [ ] Database integration
- [ ] Push notifications

---

## Development Guidelines

### Code Style

- Use functional components with hooks
- Prefer named exports
- One component per file
- Co-locate styles (CSS Modules) with components
- Use `type` for object shapes, `interface` for extendable contracts

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MessageBubble.tsx` |
| Hooks | camelCase with `use` prefix | `useConversations.ts` |
| Utils | camelCase | `formatAddress.ts` |
| Types | PascalCase | `ConversationPreview` |
| CSS Modules | camelCase | `styles.messageContainer` |
| CSS Variables | kebab-case | `--color-accent` |

### Git Conventions

```
feat: Add conversation list component
fix: Resolve message ordering issue
refactor: Extract XMTP client logic to service
style: Update button hover states
docs: Add API integration notes
chore: Update dependencies
```

### Testing Strategy (Future)

- Unit tests: Utility functions, hooks
- Component tests: React Testing Library
- E2E tests: Playwright for critical flows

---

## Security Considerations

1. **Private Keys**: Never handle wallet private keys directly. WalletConnect handles signing.

2. **XMTP Keys**: Stored in browser's IndexedDB by XMTP SDK. Encrypted.

3. **Message Content**: End-to-end encrypted by XMTP. Never logged or stored server-side.

4. **Ethos Data**: Public reputation data only. No sensitive info.

5. **CORS**: If using API routes as proxy, validate origins.

---

## Performance Considerations

1. **Message Virtualization**: Use virtual list for long conversations (react-window or similar)

2. **Image Optimization**: Use Next.js Image component for avatars

3. **Code Splitting**: Leverage Next.js automatic code splitting

4. **Caching**: 
   - Ethos scores: Cache for 5 minutes
   - Conversation list: Real-time via XMTP
   - Messages: Persist in XMTP local storage

5. **Bundle Size**: Monitor with `@next/bundle-analyzer`

---

## Troubleshooting

### Common Issues

**XMTP client not initializing**
- Check wallet is connected
- Verify signature was completed
- Check XMTP_ENV matches network

**Messages not appearing**
- Verify consent state is correct
- Check streaming connection
- Verify conversation ID is valid

**WalletConnect not connecting**
- Verify PROJECT_ID is set
- Check network configuration
- Try clearing localStorage

---

## Resources

- [XMTP Documentation](https://docs.xmtp.org)
- [XMTP Browser SDK](https://docs.xmtp.org/chat-apps/sdks/browser)
- [XMTP Local Node](https://github.com/xmtp/xmtp-local-node)
- [Ethos API Docs](https://developers.ethos.network)
- [WalletConnect Docs](https://docs.walletconnect.com)
- [wagmi Documentation](https://wagmi.sh)
- [Next.js App Router](https://nextjs.org/docs/app)
