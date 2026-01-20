'use client';

import { useMessageRequests } from './useConversations';

/**
 * Hook to get the count of new message requests (pending/unknown consent state).
 *
 * This is used for displaying badge counts on the navigation.
 *
 * @returns Object containing:
 *   - count: Number of pending message requests
 *   - isLoading: Whether the data is still loading
 *
 * @example
 * ```tsx
 * function NavBadge() {
 *   const { count, isLoading } = useNewRequestsCount();
 *
 *   if (isLoading || count === 0) return null;
 *
 *   return <Badge count={count} />;
 * }
 * ```
 */
export function useNewRequestsCount(): { count: number; isLoading: boolean } {
  const { filteredPreviews, isLoading } = useMessageRequests();

  return { count: filteredPreviews.length, isLoading };
}
