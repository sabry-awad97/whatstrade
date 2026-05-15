/**
 * Offers Constants
 *
 * Centralized configuration for offer status colors and other constants.
 */

/**
 * Color mapping for offer statuses
 * Used across badges and other UI elements
 */
export const STATUS_COLORS: Record<string, string> = {
  active:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
  matched:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  expired:
    "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
} as const;

/**
 * Type-safe offer status keys
 */
export type OfferStatus = keyof typeof STATUS_COLORS;

/**
 * Available filter options for offers
 */
export const FILTER_OPTIONS = ["all", "active", "matched", "expired"] as const;

export type FilterOption = (typeof FILTER_OPTIONS)[number];
