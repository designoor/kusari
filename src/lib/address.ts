/**
 * Ethereum address formatting and validation utilities
 */

import type { AddressFormat } from '@/types/user';

/**
 * Truncate an Ethereum address for display
 * @param address - Full Ethereum address
 * @param prefixLength - Number of characters to show at start (including 0x)
 * @param suffixLength - Number of characters to show at end
 * @returns Truncated address like "0x1234...5678"
 */
export function truncateAddress(
  address: string,
  prefixLength = 6,
  suffixLength = 4
): string {
  if (!address) return '';
  if (address.length <= prefixLength + suffixLength) return address;

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * Format an address for display based on format type
 * @param address - Full Ethereum address
 * @param format - Display format: 'full', 'short', or 'ens'
 * @param ensName - Optional ENS name to use when format is 'ens'
 * @returns Formatted address string
 */
export function formatAddress(
  address: string,
  format: AddressFormat = 'short',
  ensName?: string | null
): string {
  if (!address) return '';

  switch (format) {
    case 'full':
      return address;
    case 'ens':
      return ensName ?? truncateAddress(address);
    case 'short':
    default:
      return truncateAddress(address);
  }
}

/**
 * Validate if a string is a valid Ethereum address
 * @param address - String to validate
 * @returns True if valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Normalize an Ethereum address to lowercase
 * Note: For checksum addresses, use viem's getAddress() instead
 * @param address - Ethereum address to normalize
 * @returns Lowercase address or empty string if invalid
 */
export function normalizeAddress(address: string): string {
  if (!isValidAddress(address)) return '';
  return address.toLowerCase();
}

/**
 * Compare two Ethereum addresses (case-insensitive)
 * @param a - First address
 * @param b - Second address
 * @returns True if addresses are equal
 */
export function addressesEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  return normalizeAddress(a) === normalizeAddress(b);
}

/**
 * Generate a consistent color from an Ethereum address
 * Useful for avatar backgrounds and visual identification
 * @param address - Ethereum address
 * @returns CSS color string (HSL for valid addresses, hex fallback)
 */
export function getColorFromAddress(address: string): string {
  if (!address) return '#5bff8c'; // Default accent color (--color-accent)

  // Simple hash function for consistent color generation
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  // Convert to hue (0-360)
  const hue = Math.abs(hash % 360);

  // Use good saturation and lightness for dark backgrounds
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Get initials from an Ethereum address
 * Takes first 2 hex characters after 0x prefix
 * @param address - Ethereum address
 * @returns Two-character initials string
 */
export function getInitialsFromAddress(address: string): string {
  if (!address) return '??';

  // Remove 0x prefix if present
  const cleanAddress = address.toLowerCase().startsWith('0x')
    ? address.slice(2)
    : address;

  // Take first 2 characters and uppercase
  return cleanAddress.slice(0, 2).toUpperCase();
}

/**
 * Get a display name for an address, preferring ENS name if available
 * @param address - Ethereum address
 * @param ensName - Optional ENS name
 * @returns Display name (ENS name or truncated address)
 */
export function getDisplayName(
  address: string,
  ensName?: string | null
): string {
  if (ensName) return ensName;
  return truncateAddress(address);
}

/**
 * Check if a string looks like an ENS name
 * Supports subdomains, single-char names, and unicode/emoji names
 * Excludes control characters for security
 * @param value - String to check
 * @returns True if it looks like an ENS name
 */
export function isEnsName(value: string): boolean {
  if (!value || value.length < 5) return false; // Minimum: "a.eth"
  // ENS validation: one or more labels ending with .eth
  // Excludes whitespace, dots (label separators), and control characters
  return /^(?:[^\s.\x00-\x1f\x7f-\x9f]+\.)+eth$/i.test(value);
}

/**
 * Compare two identifiers (addresses, inbox IDs, or ENS names) for equality
 * - For valid hex addresses: uses checksumless comparison
 * - For other identifiers: case-insensitive string comparison
 * @param a - First identifier
 * @param b - Second identifier
 * @returns True if identifiers match
 */
export function identifiersMatch(a: string, b: string): boolean {
  if (!a || !b) return false;

  // If both are valid hex addresses, use proper address comparison
  if (isValidAddress(a) && isValidAddress(b)) {
    return addressesEqual(a, b);
  }

  // Otherwise, fall back to case-insensitive string comparison
  return a.toLowerCase() === b.toLowerCase();
}
