/**
 * Ethos API Types
 * Based on Ethos Network API v2: https://api.ethos.network/api/v2
 *
 * Uses Zod schemas for runtime validation with inferred TypeScript types
 */

import { z } from 'zod';

/**
 * Score level schema - ranges from 'untrusted' (lowest) to 'renowned' (highest)
 */
export const ethosScoreLevelSchema = z.enum([
  'untrusted',
  'questionable',
  'neutral',
  'known',
  'established',
  'reputable',
  'exemplary',
  'distinguished',
  'revered',
  'renowned',
]);

export type EthosScoreLevel = z.infer<typeof ethosScoreLevelSchema>;

/**
 * User status schema
 */
export const ethosUserStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'MERGED']);

export type EthosUserStatus = z.infer<typeof ethosUserStatusSchema>;

/**
 * Score response schema from GET /score/address endpoint
 */
export const ethosScoreResponseSchema = z.object({
  score: z.number(),
  level: ethosScoreLevelSchema,
});

export type EthosScoreResponse = z.infer<typeof ethosScoreResponseSchema>;

/**
 * Review stats schema
 */
export const ethosReviewStatsSchema = z.object({
  received: z.object({
    negative: z.number(),
    neutral: z.number(),
    positive: z.number(),
  }),
});

export type EthosReviewStats = z.infer<typeof ethosReviewStatsSchema>;

/**
 * Vouch stats schema
 */
export const ethosVouchStatsSchema = z.object({
  given: z.object({
    amountWeiTotal: z.string(),
    count: z.number(),
  }),
  received: z.object({
    amountWeiTotal: z.string(),
    count: z.number(),
  }),
});

export type EthosVouchStats = z.infer<typeof ethosVouchStatsSchema>;

/**
 * User stats schema
 */
export const ethosUserStatsSchema = z.object({
  review: ethosReviewStatsSchema,
  vouch: ethosVouchStatsSchema,
});

export type EthosUserStats = z.infer<typeof ethosUserStatsSchema>;

/**
 * Profile links schema
 */
export const ethosProfileLinksSchema = z.object({
  profile: z.string(),
  scoreBreakdown: z.string(),
});

export type EthosProfileLinks = z.infer<typeof ethosProfileLinksSchema>;

/**
 * Full user response schema from GET /user/by/address/{address} endpoint
 */
export const ethosUserResponseSchema = z.object({
  id: z.number(),
  profileId: z.number().nullable(),
  displayName: z.string(),
  username: z.string().nullable(),
  avatarUrl: z.string(),
  description: z.string().nullable(),
  score: z.number(),
  status: ethosUserStatusSchema,
  userkeys: z.array(z.string()),
  xpTotal: z.number(),
  xpStreakDays: z.number(),
  xpRemovedDueToAbuse: z.boolean(),
  influenceFactor: z.number(),
  influenceFactorPercentile: z.number(),
  links: ethosProfileLinksSchema,
  stats: ethosUserStatsSchema,
});

export type EthosUserResponse = z.infer<typeof ethosUserResponseSchema>;

/**
 * Batch scores response schema from POST /score/addresses endpoint
 * Returns a record mapping addresses to score responses
 */
export const ethosScoresBatchResponseSchema = z.record(z.string(), ethosScoreResponseSchema);

export type EthosScoresBatchResponse = z.infer<typeof ethosScoresBatchResponseSchema>;

/**
 * Batch users response schema from POST /users/by/address endpoint
 * Returns an array of user responses
 */
export const ethosUsersBatchResponseSchema = z.array(ethosUserResponseSchema);

export type EthosUsersBatchResponse = z.infer<typeof ethosUsersBatchResponseSchema>;

/**
 * Ethos API error response
 */
export interface EthosErrorResponse {
  message: string;
  code: string;
  data: {
    code: string;
    httpStatus: number;
  };
  issues: unknown;
}

/**
 * Normalized Ethos profile data for use in the app
 * Combines score and user data into a simpler format
 */
export interface EthosProfile {
  userId: number;
  profileId: number | null;
  displayName: string;
  username: string | null;
  avatarUrl: string;
  description: string | null;
  score: number;
  level: EthosScoreLevel;
  status: EthosUserStatus;
  reviews: {
    positive: number;
    negative: number;
    neutral: number;
  };
  vouches: {
    given: number;
    received: number;
  };
  profileUrl: string;
  scoreBreakdownUrl: string;
}

/**
 * Hook return type for useEthosScore
 */
export interface UseEthosScoreReturn {
  data: EthosProfile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
