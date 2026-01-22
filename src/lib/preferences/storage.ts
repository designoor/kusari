/**
 * User preferences storage using localStorage
 * Handles SSR safety and provides type-safe getters/setters
 */

const STORAGE_KEY_HIDE_PREVIEWS = 'kusari_hide_message_previews';

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
