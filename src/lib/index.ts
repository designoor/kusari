// Address utilities
export {
  truncateAddress,
  formatAddress,
  isValidAddress,
  normalizeAddress,
  addressesEqual,
  getColorFromAddress,
  getInitialsFromAddress,
  getDisplayName,
  isEnsName,
} from './address';

// Time utilities
export {
  isToday,
  isYesterday,
  isThisWeek,
  isThisYear,
  formatTime,
  formatRelativeTime,
  formatMessageTime,
  formatFullDate,
  formatMessageSeparator,
  getTimeDifference,
} from './time';

// Validation schemas and utilities
export {
  // Schemas
  ethereumAddressSchema,
  normalizedEthereumAddressSchema,
  ensNameSchema,
  addressOrEnsSchema,
  messageContentSchema,
  conversationIdSchema,
  inboxIdSchema,
  consentStateSchema,
  consentActionSchema,
  searchQuerySchema,
  ethosUserKeySchema,
  paginationSchema,
  envSchema,
  createApiResponseSchema,
  // Types
  type EthereumAddress,
  type NormalizedEthereumAddress,
  type EnsName,
  type AddressOrEns,
  type MessageContent,
  type ConversationId,
  type InboxId,
  type ValidatedConsentState,
  type ConsentAction,
  type SearchQuery,
  type EthosUserKey,
  type PaginationParams,
  type EnvConfig,
  // Utility functions
  safeParse,
  validate,
} from './validation';
