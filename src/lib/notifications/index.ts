/**
 * Browser Notification API utilities
 * Handles permission management and notification display
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Check if the browser supports the Notification API
 */
export function isBrowserNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

/**
 * Get the current notification permission state
 */
export function getNotificationPermissionState(): NotificationPermissionState {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 * Returns the resulting permission state
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }

  // If already granted or denied, return current state
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    // Fallback for older browsers that use callback-based API
    return new Promise((resolve) => {
      Notification.requestPermission((result) => {
        resolve(result);
      });
    });
  }
}

export interface ShowNotificationOptions {
  /** Notification title */
  title: string;
  /** Notification body text */
  body: string;
  /** Icon URL (optional) */
  icon?: string;
  /** Tag for deduplication - notifications with same tag replace each other */
  tag?: string;
  /** Callback when notification is clicked */
  onClick?: () => void;
}

/**
 * Show a browser notification
 * Returns the Notification instance or null if unable to show
 */
export function showNotification(options: ShowNotificationOptions): Notification | null {
  if (!isBrowserNotificationSupported()) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon,
      tag: options.tag,
      // Require user interaction to dismiss (where supported)
      requireInteraction: false,
    });

    if (options.onClick) {
      notification.onclick = () => {
        options.onClick?.();
        notification.close();
      };
    }

    return notification;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return null;
  }
}
