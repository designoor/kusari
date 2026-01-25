'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchEthosProfile, fetchEthosProfiles } from '@/services/ethos';
import type { EthosProfile, UseEthosScoreReturn } from '@/services/ethos';

/**
 * Generates a stable, sorted key from an array of addresses.
 * Used for comparing address sets and tracking which addresses have been processed.
 *
 * @param addresses - Array of Ethereum addresses
 * @returns Lowercase, sorted, comma-separated string of addresses
 */
export function generateAddressesKey(addresses: string[]): string {
  return addresses.map((a) => a.toLowerCase()).sort().join(',');
}

/**
 * Hook to fetch and cache Ethos reputation data for an address.
 *
 * Features:
 * - Automatically fetches profile when address changes
 * - Caches results to avoid redundant API calls
 * - Provides loading and error states
 * - Includes refetch method for manual updates
 *
 * @param address - Ethereum address to fetch Ethos profile for
 * @returns Object containing profile data, loading state, error, and refetch method
 *
 * @example
 * ```tsx
 * function ReputationDisplay({ address }: { address: string }) {
 *   const { data, isLoading, error } = useEthosScore(address);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error || !data) return <span>Not verified</span>;
 *
 *   return (
 *     <div>
 *       <span>Score: {data.score}</span>
 *       <span>Level: {data.level}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function useEthosScore(address: string | null | undefined): UseEthosScoreReturn {
  const [data, setData] = useState<EthosProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Track current address to handle race conditions
  const currentAddressRef = useRef<string | null | undefined>(address);

  const fetchProfile = useCallback(async (addr: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const profile = await fetchEthosProfile(addr);
      // Only update state if this is still the current address
      if (currentAddressRef.current === addr) {
        setData(profile);
        setIsLoading(false);
      }
    } catch (err) {
      // Only update state if this is still the current address
      if (currentAddressRef.current === addr) {
        const error = err instanceof Error ? err : new Error('Failed to fetch Ethos profile');
        setError(error);
        setData(null);
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(async () => {
    if (address) {
      await fetchProfile(address);
    }
  }, [address, fetchProfile]);

  useEffect(() => {
    currentAddressRef.current = address;

    if (!address) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError(new Error('Invalid Ethereum address'));
      setData(null);
      setIsLoading(false);
      return;
    }

    void fetchProfile(address);
  }, [address, fetchProfile]);

  return { data, isLoading, error, refetch };
}

/**
 * Hook to fetch Ethos scores for multiple addresses.
 *
 * Useful for displaying scores in a list view where multiple
 * addresses need to be fetched at once.
 *
 * @param addresses - Array of Ethereum addresses to fetch scores for
 * @returns Map of address to profile data, plus loading state
 *
 * @example
 * ```tsx
 * function ContactsList({ contacts }: { contacts: Contact[] }) {
 *   const addresses = contacts.map(c => c.address);
 *   const { profiles, isLoading } = useEthosScores(addresses);
 *
 *   return contacts.map(contact => (
 *     <ContactItem
 *       key={contact.address}
 *       contact={contact}
 *       score={profiles.get(contact.address)?.score}
 *     />
 *   ));
 * }
 * ```
 */
export function useEthosScores(addresses: string[]): {
  profiles: Map<string, EthosProfile>;
  isLoading: boolean;
  errors: Map<string, Error>;
  /** Key representing the addresses that have been fully processed */
  completedKey: string;
} {
  const [profiles, setProfiles] = useState<Map<string, EthosProfile>>(new Map());
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());
  // Track which addressesKey the current profiles correspond to
  const [loadedKey, setLoadedKey] = useState<string>('');

  // Create a stable key from addresses for comparison and dependency tracking
  // Sort to ensure consistent ordering regardless of input order
  const addressesKey = useMemo(() => generateAddressesKey(addresses), [addresses]);

  // Track current key to handle race conditions (compare by content, not reference)
  const currentKeyRef = useRef<string>(addressesKey);

  useEffect(() => {
    currentKeyRef.current = addressesKey;

    if (addresses.length === 0) {
      setProfiles(new Map());
      setIsFetching(false);
      setErrors(new Map());
      setLoadedKey('');
      return;
    }

    // Set fetching immediately (synchronously) to avoid render gap
    setIsFetching(true);

    const fetchAll = async () => {
      try {
        // Use optimized batch fetch (reduces API calls from 2N to N+1)
        const profilesMap = await fetchEthosProfiles(addresses);

        // Only update state if addresses haven't changed (compare by content via key)
        if (currentKeyRef.current === addressesKey) {
          setProfiles(profilesMap);
          setErrors(new Map());
          setIsFetching(false);
          setLoadedKey(addressesKey);
        }
      } catch (err) {
        // Only update state if addresses haven't changed
        if (currentKeyRef.current === addressesKey) {
          const error = err instanceof Error ? err : new Error('Failed to fetch Ethos profiles');
          // Set error for all addresses since batch fetch failed
          const newErrors = new Map<string, Error>();
          for (const addr of addresses) {
            newErrors.set(addr.toLowerCase(), error);
          }
          setErrors(newErrors);
          setProfiles(new Map());
          setIsFetching(false);
          setLoadedKey(addressesKey); // Still mark as loaded (with errors)
        }
      }
    };

    void fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- addressesKey captures content changes; addresses ref not needed
  }, [addressesKey]);

  // Derived loading state: loading if we're actively fetching OR if addressesKey doesn't match loadedKey
  // This handles the render gap where effect hasn't run yet
  const isLoading = isFetching || (addresses.length > 0 && addressesKey !== loadedKey);

  return { profiles, isLoading, errors, completedKey: loadedKey };
}
