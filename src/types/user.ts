/**
 * User profile information
 */
export interface UserProfile {
  address: string;
  displayName?: string;
  ensName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Current user state
 */
export interface CurrentUser {
  address: string;
  isConnected: boolean;
  hasXmtpIdentity: boolean;
}

/**
 * Contact information
 */
export interface Contact extends UserProfile {
  consentState: 'allowed' | 'denied' | 'unknown';
  lastInteraction?: Date;
  conversationId?: string;
}

/**
 * Address display format options
 */
export type AddressFormat = 'full' | 'short' | 'ens';

/**
 * ENS resolution result
 */
export interface EnsResolution {
  address: string;
  ensName: string | null;
  avatarUrl: string | null;
  isLoading: boolean;
  error?: string;
}
