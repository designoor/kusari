/**
 * Date and time formatting utilities for messaging UI
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Check if a date is within the last 7 days
 */
export function isThisWeek(date: Date): boolean {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff < WEEK && diff >= 0;
}

/**
 * Check if a date is within the current year
 */
export function isThisYear(date: Date): boolean {
  return date.getFullYear() === new Date().getFullYear();
}

/**
 * Format a time as HH:MM (12-hour format with AM/PM)
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date relative to now (for conversation lists)
 * - Just now (< 1 minute)
 * - Xm ago (< 1 hour)
 * - Xh ago (< 24 hours, same day)
 * - Yesterday
 * - Weekday name (this week)
 * - MMM D (this year)
 * - MMM D, YYYY (older)
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Handle future dates (e.g., minor clock skew) as "Just now"
  if (diff < 0 || diff < MINUTE) {
    return 'Just now';
  }

  // Minutes ago
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes}m ago`;
  }

  // Hours ago (same day)
  if (isToday(date)) {
    const hours = Math.floor(diff / HOUR);
    return `${hours}h ago`;
  }

  // Yesterday
  if (isYesterday(date)) {
    return 'Yesterday';
  }

  // This week - show day name
  if (isThisWeek(date)) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // This year - show month and day
  if (isThisYear(date)) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Older - show full date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time for message bubbles
 * - Today: 2:30 PM
 * - Yesterday: Yesterday 2:30 PM
 * - This week: Mon 2:30 PM
 * - Older: Jan 5, 2:30 PM or Jan 5, 2024, 2:30 PM
 */
export function formatMessageTime(date: Date): string {
  const time = formatTime(date);

  if (isToday(date)) {
    return time;
  }

  if (isYesterday(date)) {
    return `Yesterday ${time}`;
  }

  if (isThisWeek(date)) {
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${day} ${time}`;
  }

  if (isThisYear(date)) {
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${dateStr}, ${time}`;
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${dateStr}, ${time}`;
}

/**
 * Format a full date for detailed views
 * Example: January 5, 2024 at 2:30 PM
 */
export function formatFullDate(date: Date): string {
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const time = formatTime(date);
  return `${dateStr} at ${time}`;
}

/**
 * Format a date for message separators (day dividers in chat)
 * - Today
 * - Yesterday
 * - Monday, January 5
 * - Monday, January 5, 2024 (different year)
 */
export function formatMessageSeparator(date: Date): string {
  if (isToday(date)) {
    return 'Today';
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  if (isThisYear(date)) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get time difference in a human-readable format
 * Used for "last seen X ago" or "joined X ago"
 */
export function getTimeDifference(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 0) {
    return 'in the future';
  }

  if (diff < MINUTE) {
    return 'just now';
  }

  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  const weeks = Math.floor(diff / WEEK);
  if (weeks < 4) {
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(diff / (30 * DAY));
  if (months < 12) {
    return `${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(diff / (365 * DAY));
  return `${years} year${years === 1 ? '' : 's'} ago`;
}
