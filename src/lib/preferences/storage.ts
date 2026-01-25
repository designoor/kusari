/**
 * User preferences storage using localStorage
 * Handles SSR safety and provides type-safe getters/setters
 */

const STORAGE_KEY_HIDE_PREVIEWS = 'kusari_hide_message_previews';
const STORAGE_KEY_DISABLE_READ_RECEIPTS = 'kusari_disable_read_receipts';

/**
 * Check if message previews should be hidden
 * @returns true if previews should be hidden, false otherwise
 */
export function getHideMessagePreviews(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_HIDE_PREVIEWS) === 'true';
}

/**
 * Set the hide message previews preference
 * @param hide - Whether to hide message previews
 */
export function setHideMessagePreviews(hide: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_HIDE_PREVIEWS, hide.toString());
}

/**
 * Check if read receipts are disabled (privacy setting)
 * When disabled, the app won't notify others when you've read their messages
 * @returns true if read receipts are disabled, false otherwise
 */
export function getDisableReadReceipts(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_DISABLE_READ_RECEIPTS) === 'true';
}

/**
 * Set the disable read receipts preference
 * @param disable - Whether to disable sending read receipts
 */
export function setDisableReadReceipts(disable: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_DISABLE_READ_RECEIPTS, disable.toString());
}
