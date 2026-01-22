# Kusari - Web3 Messaging Client

## Project Overview

Kusari is a decentralized messaging application built on XMTP protocol, enabling Web3 identities to communicate securely. The app integrates with Ethos Network to display reputation scores, helping users make informed decisions about accepting message requests.

### Core Value Proposition

- **Trust-Based Messaging**: Users can review sender reputation (via Ethos) before accepting conversations
- **Spam-Free Inbox**: Only messages from accepted contacts appear in the main chat view
- **Web3 Native**: Wallet-based identity, no email/password required
- **Privacy-First**: End-to-end encrypted messages via XMTP

**Current State**: MVP Complete - 1:1 text messaging is production-ready.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Messaging | XMTP Browser SDK |
| Wallet | WalletConnect v2 + wagmi |
| Validation | Zod |
| Styling | CSS Modules |

**External Services**: XMTP Network, Ethos Network, WalletConnect

---

## Architecture Principles

1. **Strong Typing**: No `any` types. Zod schemas for API inputs. Discriminated unions for state.

2. **Clean Separation**:
   - `components/` - Pure presentation, no business logic
   - `hooks/` - Business logic, state management, side effects
   - `services/` - External API interactions (XMTP, Ethos)
   - `types/` - Shared type definitions

3. **Reusable Components**: All UI primitives are configurable via props, component library mindset.

4. **Extensible**: Architecture supports future group chat, rich content types, payment-gated messaging.

---

## File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── chat/[conversationId]/
│   ├── contacts/[address]/
│   ├── contacts/requests/
│   ├── contacts/denied/
│   └── settings/
├── components/
│   ├── ui/                 # Reusable primitives (Button, Avatar, Modal, etc.)
│   ├── layout/             # AppShell, MainNav, AuthGuard
│   ├── chat/               # ConversationList, MessageList, MessageInput
│   ├── contacts/           # ContactList, ContactItem, ContactActions
│   ├── onboarding/         # OnboardingFlow, step components
│   └── reputation/         # EthosScore, EthosReputationPanel
├── hooks/                  # useConversations, useMessages, useConsent, useEthosScore
├── services/
│   ├── xmtp/               # client, consent, conversations, messages, identity
│   └── ethos/              # api (with caching), types
├── providers/              # WalletProvider, XmtpProvider, EthosProvider, ToastProvider
├── types/                  # Shared TypeScript types
├── lib/                    # Utilities (address formatting, time, validation)
└── styles/                 # Global CSS with design tokens
```

---

## XMTP Integration

### Consent States

| State | Meaning | UI Location |
|-------|---------|-------------|
| `allowed` | User accepted this contact | `/chat` + Contacts list |
| `unknown` | New/pending contact | `/contacts/requests` |
| `denied` | User blocked this contact | `/contacts/denied` |

### Ethereum Addresses vs XMTP Inbox IDs

XMTP uses two distinct identifier types:

| Identifier | Format | Purpose |
|------------|--------|---------|
| Ethereum Address | `0x` + 40 hex chars | Wallet identity, Ethos lookups |
| XMTP Inbox ID | Varies (not `0x...`) | Internal XMTP messaging |

**Why This Matters:**

1. **Ethos API**: Only accepts Ethereum addresses. Validation regex `/^0x[a-fA-F0-9]{40}$/` rejects inbox IDs.
2. **XMTP Operations**: Consent, message routing use inbox IDs internally.
3. **Address Resolution**: Use `getAddressForInboxId()` or `getAddressesForInboxIds()` to convert.

**Code Patterns:**

```typescript
// ❌ WRONG: Using peerInboxId for Ethos (will fail validation)
const { data } = useEthosScore(peerInboxId);

// ✅ CORRECT: Only use peerAddress for Ethos lookups
const { data } = useEthosScore(peerAddress ?? null);

// ✅ CORRECT: Validate before Ethos fetch
const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
const addressForEthos = isValidEthAddress ? address : null;
```

**Data Flow:**

```
XMTP Conversation → peerInboxId → getAddressForInboxId() → peerAddress
                                                              ├──▶ Ethos API
                                                              ├──▶ Avatar display
                                                              └──▶ Address display
```

**Key Files**: `services/xmtp/identity.ts`, `hooks/useEthosScore.ts`, `components/chat/ConversationItem/`

### Extensibility

- **Group chat**: Use `client.conversations.newGroup()`, handle permissions/metadata
- **Rich content**: Install `@xmtp/content-type-*` codecs, update MessageBubble

---

## Ethos Integration

**API**: `https://api.ethos.network/api/v2` with header `X-Ethos-Client: kusari@1.0.0`

**Implementation** (`src/services/ethos/api.ts`):
- `fetchEthosProfile(address)` - Single profile with 5-min cache
- `fetchEthosProfiles(addresses)` - Batch fetch (2 API calls instead of N+1)

**Hooks**:
```typescript
const { data, isLoading } = useEthosScore(address);      // Single
const { profiles } = useEthosScores(addresses);          // Batch
```

---

## Key Hooks

| Hook | Purpose |
|------|---------|
| `useConversations()` | Conversation list with filtering by consent |
| `useAllowedConversations()` | Preset for allowed contacts only |
| `useMessageRequests()` | Preset for unknown consent contacts |
| `useMessages(conversationId)` | Messages with real-time streaming |
| `useConsent()` | Allow/deny operations |
| `useInboxConsent(inboxId)` | Per-inbox consent state with streaming |
| `useEthosScore(address)` | Single Ethos profile |
| `useEthosScores(addresses)` | Batch Ethos profiles |
| `usePreferences()` | User settings (hideMessagePreviews, etc.) |

---

## Providers

| Provider | Purpose |
|----------|---------|
| `PreferencesProvider` | App-wide user preferences |
| `WalletProvider` | wagmi + AppKit wallet connections |
| `XmtpProvider` | XMTP client lifecycle |
| `EthosProvider` | Centralized profile caching for allowed contacts |
| `ToastProvider` | Toast notifications |

---

## User Flows

**Onboarding**: Welcome → Connect Wallet → Sign XMTP Message → `/chat`

**Chat**:
- Desktop: Split view (sidebar + conversation list + active chat)
- Mobile: List view → Chat view with back button

**Contacts**:
- `/contacts` - Search + section links + accepted contacts list
- `/contacts/requests` - Unknown consent contacts with Ethos scores
- `/contacts/denied` - Blocked contacts
- `/contacts/[address]` - Contact detail with reputation panel + actions

**Actions by consent state**:
- `unknown`: Accept (→ allowed) or Decline (→ denied)
- `allowed`: Block (→ denied) or Move to Requests (→ unknown)
- `denied`: Unblock (→ allowed)

---

## Environment Variables

```bash
NEXT_PUBLIC_XMTP_ENV=local|production
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=xxx
```

---

## Development Guidelines

**Code Style**:
- Functional components with hooks
- Named exports, one component per file
- Co-locate CSS Modules with components
- `type` for shapes, `interface` for extendable contracts

**Naming**:
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- CSS Modules: `styles.camelCase`

**Git**: `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`

---

## Troubleshooting

**XMTP client not initializing**: Check wallet connected, signature completed, XMTP_ENV correct.

**Messages not appearing**: Verify consent state, check streaming connection, validate conversation ID.

**Ethos profiles not loading**: Ensure using Ethereum address (not inbox ID) for lookups.

---

## Resources

- [XMTP Docs](https://docs.xmtp.org)
- [Ethos API](https://developers.ethos.network)
- [WalletConnect](https://docs.walletconnect.com)
- [wagmi](https://wagmi.sh)
