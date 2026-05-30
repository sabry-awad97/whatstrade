/**
 * Simulate Constants
 *
 * Centralized configuration for simulation page.
 * Uses CVA (Class Variance Authority) for type-safe styling variants.
 */

import { cva, type VariantProps } from "class-variance-authority";

// ============================================================================
// Sample Messages
// ============================================================================

export const SAMPLE_MESSAGES = [
  "عندي باندول اكسترا 500 مجم 300 حبة بسعر 13 جنيه للحبة، دلوقتي متاح",
  "محتاج اوجمنتين 625 مجم مش اقل من 200 حبة، السعر اقصاه 90 جنيه",
  "متوفر نيكسيوم 40 مجم 150 حبة بسعر 90 جنيه للحبة واحدة",
  "عايز برفين 400 مجم حوالي 200 قرص، الاسعار المتاحة؟",
  "عندي امبيسلين 500 250 حبة بسعر 18 للحبة مهتمين يتواصلوا",
];

// ============================================================================
// Confidence Band Types
// ============================================================================

export type ConfidenceBand = "auto" | "suggest" | "review" | "none";

// ============================================================================
// Color Constants (for inline styles and charts)
// ============================================================================

export const BAND_COLORS: Record<ConfidenceBand, string> = {
  auto: "hsl(142 72% 35%)",
  suggest: "hsl(38 92% 50%)",
  review: "hsl(21 85% 50%)",
  none: "hsl(0 72% 48%)",
};

export const BAND_COLORS_ALPHA: Record<
  ConfidenceBand,
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
};

// ============================================================================
// CVA Variants (Type-safe Tailwind classes)
// ============================================================================

/**
 * Confidence band badge styles using CVA
 *
 * @example
 * ```tsx
 * <span className={confidenceBadgeVariants({ band: "auto" })}>
 *   AUTO
 * </span>
 * ```
 */
export const confidenceBadgeVariants = cva(
  "text-[9px] px-1.5 py-0.5 rounded font-bold",
  {
    variants: {
      band: {
        auto: "bg-green-600 text-white",
        suggest: "bg-amber-500 text-white",
        review: "bg-orange-500 text-white",
        none: "bg-red-600 text-white",
      },
    },
    defaultVariants: {
      band: "none",
    },
  },
);

/**
 * Confidence band text color variants
 *
 * @example
 * ```tsx
 * <span className={confidenceTextVariants({ band: "auto" })}>
 *   High confidence
 * </span>
 * ```
 */
export const confidenceTextVariants = cva("", {
  variants: {
    band: {
      auto: "text-green-600",
      suggest: "text-amber-500",
      review: "text-orange-500",
      none: "text-red-600",
    },
  },
  defaultVariants: {
    band: "none",
  },
});

/**
 * Confidence band background variants
 *
 * @example
 * ```tsx
 * <div className={confidenceBgVariants({ band: "auto" })}>
 *   Content
 * </div>
 * ```
 */
export const confidenceBgVariants = cva("", {
  variants: {
    band: {
      auto: "bg-green-50 dark:bg-green-950/20",
      suggest: "bg-amber-50 dark:bg-amber-950/20",
      review: "bg-orange-50 dark:bg-orange-950/20",
      none: "bg-red-50 dark:bg-red-950/20",
    },
  },
  defaultVariants: {
    band: "none",
  },
});

/**
 * Confidence band border variants
 *
 * @example
 * ```tsx
 * <div className={confidenceBorderVariants({ band: "auto" })}>
 *   Content
 * </div>
 * ```
 */
export const confidenceBorderVariants = cva("border", {
  variants: {
    band: {
      auto: "border-green-200 dark:border-green-800",
      suggest: "border-amber-200 dark:border-amber-800",
      review: "border-orange-200 dark:border-orange-800",
      none: "border-red-200 dark:border-red-800",
    },
  },
  defaultVariants: {
    band: "none",
  },
});

// ============================================================================
// Type Exports
// ============================================================================

export type ConfidenceBadgeVariants = VariantProps<
  typeof confidenceBadgeVariants
>;
export type ConfidenceTextVariants = VariantProps<
  typeof confidenceTextVariants
>;
export type ConfidenceBgVariants = VariantProps<typeof confidenceBgVariants>;
export type ConfidenceBorderVariants = VariantProps<
  typeof confidenceBorderVariants
>;

// ============================================================================
// Legacy Exports (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use confidenceBadgeVariants instead
 */
export const BAND_BG: Record<ConfidenceBand, string> = {
  auto: "bg-green-600",
  suggest: "bg-amber-500",
  review: "bg-orange-500",
  none: "bg-red-600",
};
