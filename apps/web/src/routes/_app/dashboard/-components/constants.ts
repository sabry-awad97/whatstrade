/**
 * Dashboard Constants
 *
 * Centralized configuration for dashboard colors, themes, and other constants.
 */

/**
 * Color mapping for confidence bands
 * Used across charts, badges, and other UI elements
 */
export const BAND_COLORS: Record<string, string> = {
  auto: "hsl(142 72% 35%)", // Green - High confidence
  suggest: "hsl(38 92% 50%)", // Amber - Medium confidence
  review: "hsl(21 85% 50%)", // Orange - Low confidence
  none: "hsl(0 72% 48%)", // Red - No confidence
} as const;

/**
 * Type-safe confidence band keys
 */
export type ConfidenceBand = keyof typeof BAND_COLORS;
