/**
 * Matches Constants
 *
 * Centralized configuration for matches colors, themes, and other constants.
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
 * Color mapping with alpha variants for confidence bands
 * Provides base color and light/subtle variants with proper HSL alpha syntax
 */
export const BAND_COLORS_ALPHA: Record<
  string,
  { base: string; light: string; subtle: string; glow: string }
> = {
  auto: {
    base: "hsl(142 72% 35%)",
    light: "hsl(142 72% 35% / 0.25)",
    subtle: "hsl(142 72% 35% / 0.125)",
    glow: "hsl(142 72% 35% / 0.5)",
  },
  suggest: {
    base: "hsl(38 92% 50%)",
    light: "hsl(38 92% 50% / 0.25)",
    subtle: "hsl(38 92% 50% / 0.125)",
    glow: "hsl(38 92% 50% / 0.5)",
  },
  review: {
    base: "hsl(21 85% 50%)",
    light: "hsl(21 85% 50% / 0.25)",
    subtle: "hsl(21 85% 50% / 0.125)",
    glow: "hsl(21 85% 50% / 0.5)",
  },
  none: {
    base: "hsl(0 72% 48%)",
    light: "hsl(0 72% 48% / 0.25)",
    subtle: "hsl(0 72% 48% / 0.125)",
    glow: "hsl(0 72% 48% / 0.5)",
  },
} as const;

/**
 * Type-safe confidence band keys
 */
export type ConfidenceBand = keyof typeof BAND_COLORS;

/**
 * Status color mapping for match status badges
 */
export const STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  confirmed:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",
  rejected:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
  auto_confirmed:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
} as const;
