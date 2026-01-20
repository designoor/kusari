/**
 * Zod schemas for runtime validation
 */

import { z } from 'zod';

/**
 * Ethereum address validation schema (validation only)
 * Matches 0x followed by exactly 40 hex characters
 * Preserves original casing (including EIP-55 checksums)
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

/**
 * Ethereum address schema with lowercase normalization
 * Use this when you need consistent comparison (e.g., as map keys, database lookups)
 * Note: This removes EIP-55 checksum information
 */
export const normalizedEthereumAddressSchema = ethereumAddressSchema.transform(
  (val) => val.toLowerCase()
);

/**
 * ENS name validation schema
 * Validates .eth domains including:
 * - Simple names (vitalik.eth)
 * - Subdomains (sub.domain.eth)
 * - Single-character names (a.eth)
 * - Unicode/emoji names (🦊.eth)
 * Excludes control characters for security
 */
export const ensNameSchema = z
  .string()
  .min(5, 'ENS name too short') // Minimum: "a.eth"
  .max(253, 'ENS name too long')
  .regex(
    /^(?:[^\s.\x00-\x1f\x7f-\x9f]+\.)+eth$/i,
    'Invalid ENS name format'
  );

/**
 * Address or ENS input schema
 * Accepts either a valid Ethereum address or ENS name
 */
export const addressOrEnsSchema = z.union([
  ethereumAddressSchema,
  ensNameSchema,
]);

/**
 * Message content validation schema
 * Validates message text for sending
 */
export const messageContentSchema = z
  .string()
  .min(1, 'Message cannot be empty')
  .max(10000, 'Message too long (max 10000 characters)')
  .transform((val) => val.trim());

/**
 * Conversation ID validation schema
 * XMTP conversation IDs are typically hex strings
 */
export const conversationIdSchema = z
  .string()
  .min(1, 'Conversation ID required');

/**
 * Inbox ID validation schema
 * XMTP inbox IDs
 */
export const inboxIdSchema = z
  .string()
  .min(1, 'Inbox ID required');

/**
 * Consent state validation schema
 */
export const consentStateSchema = z.enum(['allowed', 'denied', 'unknown']);

/**
 * Consent action validation schema
 */
export const consentActionSchema = z.enum(['allow', 'deny']);

/**
 * Search query validation schema
 */
export const searchQuerySchema = z
  .string()
  .max(200, 'Search query too long')
  .transform((val) => val.trim());

/**
 * Ethos user key schema
 * Format: address:0x...
 */
export const ethosUserKeySchema = z
  .string()
  .regex(/^address:0x[a-fA-F0-9]{40}$/, 'Invalid Ethos user key');

/**
 * API response wrapper schema factory
 * Creates a schema for API responses with data and error handling
 */
export function createApiResponseSchema<T extends z.ZodTypeAny>(
  dataSchema: T
) {
  return z.object({
    data: dataSchema.optional(),
    error: z.string().optional(),
    success: z.boolean(),
  });
}

/**
 * Pagination params schema
 */
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/**
 * Environment variable validation
 * Validates required environment variables at startup
 */
export const envSchema = z.object({
  NEXT_PUBLIC_XMTP_ENV: z.enum(['local', 'production']).default('local'),
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

// Type exports inferred from schemas
export type EthereumAddress = z.infer<typeof ethereumAddressSchema>;
export type NormalizedEthereumAddress = z.infer<typeof normalizedEthereumAddressSchema>;
export type EnsName = z.infer<typeof ensNameSchema>;
export type AddressOrEns = z.infer<typeof addressOrEnsSchema>;
export type MessageContent = z.infer<typeof messageContentSchema>;
export type ConversationId = z.infer<typeof conversationIdSchema>;
export type InboxId = z.infer<typeof inboxIdSchema>;
export type ValidatedConsentState = z.infer<typeof consentStateSchema>;
export type ConsentAction = z.infer<typeof consentActionSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type EthosUserKey = z.infer<typeof ethosUserKeySchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Utility function to safely parse with a schema
 * Returns parsed data or null if invalid
 */
export function safeParse<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Utility function to validate and throw on error
 * Returns parsed data or throws ZodError
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}
