/**
 * LocalStorage cache for last read timestamps and unread counts
 * Keyed by user address to support multi-account scenarios
 */

const STORAGE_PREFIX_LAST_READ = 'kusari_last_read_';
const STORAGE_PREFIX_UNREAD_COUNTS = 'kusari_unread_counts_';

/**
 * Get storage key for a user's last read times
 * @param userAddress Ethereum address of the user
 */
function getLastReadStorageKey(userAddress: string): string {
  return `${STORAGE_PREFIX_LAST_READ}${userAddress.toLowerCase()}`;
}

/**
 * Get storage key for a user's unread counts
 * @param userAddress Ethereum address of the user
 */
function getUnreadCountsStorageKey(userAddress: string): string {
  return `${STORAGE_PREFIX_UNREAD_COUNTS}${userAddress.toLowerCase()}`;
}

/**
 * Get cached last read times for a user
 * @param userAddress Ethereum address of the user
 * @returns Map of conversationId to timestamp (as string for JSON serialization)
 */
export function getCachedLastReadTimes(userAddress: string): Map<string, string> {
  if (typeof window === 'undefined') return new Map();

  try {
    const data = localStorage.getItem(getLastReadStorageKey(userAddress));
    if (!data) return new Map();
    return new Map(Object.entries(JSON.parse(data) as Record<string, string>));
  } catch {
    return new Map();
  }
}

/**
 * Update cached last read time for a conversation
 * @param userAddress Ethereum address of the user
 * @param conversationId Conversation ID
 * @param timestampNs Timestamp in nanoseconds
 */
export function setCachedLastReadTime(
  userAddress: string,
  conversationId: string,
  timestampNs: bigint
): void {
  if (typeof window === 'undefined') return;

  const existing = getCachedLastReadTimes(userAddress);
  existing.set(conversationId, timestampNs.toString());

  localStorage.setItem(
    getLastReadStorageKey(userAddress),
    JSON.stringify(Object.fromEntries(existing))
  );
}

/**
 * Clear cached last read times for a user
 * @param userAddress Ethereum address of the user
 */
export function clearCachedLastReadTimes(userAddress: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getLastReadStorageKey(userAddress));
}

/**
 * Get cached unread counts for a user
 * @param userAddress Ethereum address of the user
 * @returns Map of conversationId to unread count
 */
export function getCachedUnreadCounts(userAddress: string): Map<string, number> {
  if (typeof window === 'undefined') return new Map();

  try {
    const data = localStorage.getItem(getUnreadCountsStorageKey(userAddress));
    if (!data) return new Map();
    return new Map(Object.entries(JSON.parse(data) as Record<string, number>));
  } catch {
    return new Map();
  }
}

/**
 * Save unread counts to cache
 * @param userAddress Ethereum address of the user
 * @param unreadCounts Map of conversationId to unread count
 */
export function setCachedUnreadCounts(
  userAddress: string,
  unreadCounts: Map<string, number>
): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(
    getUnreadCountsStorageKey(userAddress),
    JSON.stringify(Object.fromEntries(unreadCounts))
  );
}

/**
 * Clear cached unread counts for a user
 * @param userAddress Ethereum address of the user
 */
export function clearCachedUnreadCounts(userAddress: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getUnreadCountsStorageKey(userAddress));
}
