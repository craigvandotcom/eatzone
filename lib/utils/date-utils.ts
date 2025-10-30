/**
 * Date utility functions for safe date comparisons
 * Handles timezone issues by comparing dates at the local date boundary level
 */

/**
 * Normalizes a date to local date boundaries (midnight) for comparison
 * This ensures consistent date comparisons regardless of timezone issues
 *
 * @param date - Date to normalize
 * @returns Date set to midnight in local timezone
 */
export function normalizeToLocalDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Compares two dates at the date-only level (ignoring time)
 * Uses local date boundaries to avoid timezone-related bugs
 *
 * @param date1 - First date to compare
 * @param date2 - Second date to compare
 * @returns true if dates are the same calendar day (local time)
 */
export function isSameLocalDate(date1: Date, date2: Date): boolean {
  const normalized1 = normalizeToLocalDate(date1);
  const normalized2 = normalizeToLocalDate(date2);
  return normalized1.getTime() === normalized2.getTime();
}

/**
 * Converts an ISO timestamp string to a normalized local date
 * Useful for comparing database timestamps with selected dates
 *
 * @param timestamp - ISO 8601 timestamp string
 * @returns Normalized Date object at local midnight
 */
export function timestampToLocalDate(timestamp: string): Date {
  return normalizeToLocalDate(new Date(timestamp));
}
