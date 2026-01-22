/**
 * Ethos API Service
 * Provides methods to interact with Ethos Network API v2
 */

import type { EthosScoreResponse, EthosUserResponse, EthosProfile, EthosScoreLevel } from './types';
import {
  ethosScoreResponseSchema,
  ethosUserResponseSchema,
  ethosScoresBatchResponseSchema,
  ethosUsersBatchResponseSchema,
} from './types';

const ETHOS_BASE_URL = 'https://api.ethos.network/api/v2';
const ETHOS_CLIENT_HEADER = 'kusari@1.0.0';

/**
 * Cache for Ethos profile data
 * TTL: 5 minutes
 */
const profileCache = new Map<string, { data: EthosProfile; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Throttle cache cleanup to avoid iterating on every fetch
 * Cleanup runs at most once per minute
 */
const CLEANUP_INTERVAL_MS = 60 * 1000;
let lastCleanupTime = 0;

/**
 * Check if cached data is still valid
 */
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL_MS;
}

/**
 * Get cached profile if valid
 */
function getCachedProfile(address: string): EthosProfile | null {
  const cached = profileCache.get(address.toLowerCase());
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  return null;
}

/**
 * Set profile in cache
 */
function setCachedProfile(address: string, data: EthosProfile): void {
  profileCache.set(address.toLowerCase(), { data, timestamp: Date.now() });
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  for (const [key, value] of profileCache.entries()) {
    if (!isCacheValid(value.timestamp)) {
      profileCache.delete(key);
    }
  }
}

/**
 * Throttled cache cleanup - runs at most once per CLEANUP_INTERVAL_MS
 * Prevents performance issues from iterating the cache on every fetch
 */
function maybeClearExpiredCache(): void {
  const now = Date.now();
  if (now - lastCleanupTime >= CLEANUP_INTERVAL_MS) {
    lastCleanupTime = now;
    clearExpiredCache();
  }
}

/**
 * Fetch score for an address
 * Endpoint: GET /score/address?address={address}
 */
export async function fetchEthosScore(address: string): Promise<EthosScoreResponse | null> {
  try {
    const response = await fetch(
      `${ETHOS_BASE_URL}/score/address?address=${encodeURIComponent(address)}`,
      {
        headers: {
          'X-Ethos-Client': ETHOS_CLIENT_HEADER,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Ethos API error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = ethosScoreResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('Invalid Ethos score response:', parsed.error);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error('Failed to fetch Ethos score:', error);
    return null;
  }
}

/**
 * Fetch user data for an address
 * Endpoint: GET /user/by/address/{address}
 */
export async function fetchEthosUser(address: string): Promise<EthosUserResponse | null> {
  try {
    const response = await fetch(
      `${ETHOS_BASE_URL}/user/by/address/${encodeURIComponent(address)}`,
      {
        headers: {
          'X-Ethos-Client': ETHOS_CLIENT_HEADER,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Ethos API error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = ethosUserResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('Invalid Ethos user response:', parsed.error);
      return null;
    }
    return parsed.data;
  } catch (error) {
    console.error('Failed to fetch Ethos user:', error);
    return null;
  }
}

/**
 * Fetch user data for multiple addresses
 * Endpoint: POST /users/by/address
 * Returns a Map keyed by lowercase address
 */
export async function fetchEthosUsers(
  addresses: string[]
): Promise<Map<string, EthosUserResponse>> {
  if (addresses.length === 0) {
    return new Map();
  }

  try {
    const response = await fetch(`${ETHOS_BASE_URL}/users/by/address`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ethos-Client': ETHOS_CLIENT_HEADER,
      },
      body: JSON.stringify({ addresses }),
    });

    if (!response.ok) {
      throw new Error(`Ethos API error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = ethosUsersBatchResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('Invalid Ethos users batch response:', parsed.error);
      return new Map();
    }

    // Convert array response to Map keyed by address (using userkeys field)
    const result = new Map<string, EthosUserResponse>();
    for (const user of parsed.data) {
      for (const userkey of user.userkeys) {
        // userkeys are in format "profileId.address", extract the address part
        const address = userkey.includes('.') ? userkey.split('.')[1] : userkey;
        if (address) {
          result.set(address.toLowerCase(), user);
        }
      }
    }
    return result;
  } catch (error) {
    console.error('Failed to fetch Ethos users:', error);
    return new Map();
  }
}

/**
 * Fetch complete Ethos profile for an address
 * Combines score and user data into a normalized format
 * Results are cached for 5 minutes
 */
export async function fetchEthosProfile(address: string): Promise<EthosProfile | null> {
  // Periodically clean up expired cache entries (throttled to once per minute)
  maybeClearExpiredCache();

  // Check cache first
  const cached = getCachedProfile(address);
  if (cached) {
    return cached;
  }

  // Fetch score and user data in parallel
  const [scoreData, userData] = await Promise.all([
    fetchEthosScore(address),
    fetchEthosUser(address),
  ]);

  // Build normalized profile from combined data
  const profile = buildProfile(address, scoreData, userData);

  // Cache the result if we got a profile
  if (profile) {
    setCachedProfile(address, profile);
  }

  return profile;
}

/**
 * Derive score level from numeric score
 * This is a fallback when we only have score but no level
 * Score ranges are approximate based on Ethos documentation
 */
function getScoreLevel(score: number): EthosScoreLevel {
  if (score < 200) return 'untrusted';
  if (score < 400) return 'questionable';
  if (score < 800) return 'neutral';
  if (score < 1200) return 'known';
  if (score < 1600) return 'established';
  if (score < 2000) return 'reputable';
  if (score < 2200) return 'exemplary';
  if (score < 2400) return 'distinguished';
  if (score < 2600) return 'revered';
  return 'renowned';
}

/**
 * Check if an address has an Ethos profile
 * Quick check using just the score endpoint (faster than full profile)
 */
export async function hasEthosProfile(address: string): Promise<boolean> {
  const score = await fetchEthosScore(address);
  return score !== null;
}

/**
 * Build a profile from score and user data
 * Extracted to share between fetchEthosProfile and fetchEthosProfiles
 */
function buildProfile(
  address: string,
  scoreData: EthosScoreResponse | null,
  userData: EthosUserResponse | null
): EthosProfile | null {
  if (!scoreData && !userData) {
    return null;
  }

  return {
    userId: userData?.id ?? 0,
    profileId: userData?.profileId ?? null,
    displayName: userData?.displayName ?? address,
    username: userData?.username ?? null,
    avatarUrl: userData?.avatarUrl ?? '',
    description: userData?.description ?? null,
    score: userData?.score ?? scoreData?.score ?? 0,
    level: scoreData?.level ?? getScoreLevel(userData?.score ?? 0),
    status: userData?.status ?? 'INACTIVE',
    reviews: {
      positive: userData?.stats?.review?.received?.positive ?? 0,
      negative: userData?.stats?.review?.received?.negative ?? 0,
      neutral: userData?.stats?.review?.received?.neutral ?? 0,
    },
    vouches: {
      given: userData?.stats?.vouch?.given?.count ?? 0,
      received: userData?.stats?.vouch?.received?.count ?? 0,
    },
    profileUrl: userData?.links?.profile ?? `https://ethos.network/profile/${address}`,
    scoreBreakdownUrl: userData?.links?.scoreBreakdown ?? '',
  };
}

/**
 * Fetch complete Ethos profiles for multiple addresses
 * Optimized to use batch endpoints for both scores and users (2 API calls total)
 * Results are cached for 5 minutes
 *
 * @param addresses - Array of Ethereum addresses to fetch profiles for
 * @returns Map of lowercase address to profile (null entries omitted)
 */
export async function fetchEthosProfiles(
  addresses: string[]
): Promise<Map<string, EthosProfile>> {
  if (addresses.length === 0) {
    return new Map();
  }

  // Periodically clean up expired cache entries (throttled to once per minute)
  maybeClearExpiredCache();

  const results = new Map<string, EthosProfile>();
  const uncachedAddresses: string[] = [];

  // Check cache first for each address
  for (const address of addresses) {
    const cached = getCachedProfile(address);
    if (cached) {
      results.set(address.toLowerCase(), cached);
    } else {
      uncachedAddresses.push(address);
    }
  }

  // If all addresses were cached, return early
  if (uncachedAddresses.length === 0) {
    return results;
  }

  // Fetch scores and users in batch (2 API calls instead of N+1)
  const [scoresMap, usersMap] = await Promise.all([
    fetchEthosScores(uncachedAddresses),
    fetchEthosUsers(uncachedAddresses),
  ]);

  // Build profiles from combined data
  for (const addr of uncachedAddresses) {
    const normalizedAddr = addr.toLowerCase();
    const scoreData = scoresMap.get(normalizedAddr) ?? scoresMap.get(addr) ?? null;
    const userData = usersMap.get(normalizedAddr) ?? usersMap.get(addr) ?? null;
    const profile = buildProfile(addr, scoreData, userData);

    if (profile) {
      setCachedProfile(addr, profile);
      results.set(normalizedAddr, profile);
    }
  }

  return results;
}

/**
 * Fetch scores for multiple addresses
 * Endpoint: POST /score/addresses
 */
export async function fetchEthosScores(
  addresses: string[]
): Promise<Map<string, EthosScoreResponse>> {
  if (addresses.length === 0) {
    return new Map();
  }

  try {
    const response = await fetch(`${ETHOS_BASE_URL}/score/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ethos-Client': ETHOS_CLIENT_HEADER,
      },
      body: JSON.stringify({ addresses }),
    });

    if (!response.ok) {
      throw new Error(`Ethos API error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = ethosScoresBatchResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('Invalid Ethos scores batch response:', parsed.error);
      return new Map();
    }
    return new Map(Object.entries(parsed.data));
  } catch (error) {
    console.error('Failed to fetch Ethos scores:', error);
    return new Map();
  }
}
